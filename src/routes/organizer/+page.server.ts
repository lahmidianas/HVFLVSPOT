import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const isAllowedRole = (role?: string | null) => role === 'organizer' || role === 'admin';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function makeUniqueSlug(title: string) {
  const base = slugify(title) || 'event';
  return `${base}-${Date.now()}`;
}

const buildLocation = (city: string | null, customCity: string | null, venue: string | null) => {
  const baseCity = (city ?? '').trim() === 'OTHER' ? (customCity ?? '').trim() : (city ?? '').trim();
  if (!baseCity) return '';
  const cleanVenue = (venue ?? '').trim();
  return cleanVenue ? `${baseCity} - ${cleanVenue}` : baseCity;
};

async function getUserAndRole(locals: any) {
  const { data: authData, error: authError } = await locals.supabase.auth.getUser();
  if (authError) console.error('[organizer] auth error', authError.message);
  const user = authData?.user;
  if (!user) return { user: null, role: null };

  const { data: dbUser, error: dbError } = await locals.supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (dbError) console.error('[organizer] users role fetch error', dbError.message);

  return { user, role: dbUser?.role ?? null };
}

const parseTickets = (form: FormData) => {
  const types = form.getAll('ticket_type') as string[];
  const customTypes = form.getAll('ticket_type_custom') as string[];
  const pricesRaw = form.getAll('ticket_price') as string[];
  const quantitiesRaw = form.getAll('ticket_quantity') as string[];

  const tickets: { type: string; price: number; quantity: number }[] = [];

  for (let i = 0; i < Math.max(types.length, pricesRaw.length, quantitiesRaw.length); i++) {
    const baseType = (types[i] ?? '').trim();
    const custom = (customTypes[i] ?? '').trim();
    const resolvedType = baseType === 'Other' ? custom : baseType;
    const price = Number(pricesRaw[i] ?? 0);
    const quantity = Number(quantitiesRaw[i] ?? 0);

    const hasAnyValue = resolvedType || !Number.isNaN(price) || !Number.isNaN(quantity);
    if (!hasAnyValue) continue;
    if (!resolvedType) return { error: 'Ticket type cannot be empty.' } as const;
    if (Number.isNaN(price) || price < 0) return { error: 'Ticket price must be >= 0.' } as const;
    if (!Number.isFinite(quantity) || quantity < 0) return { error: 'Ticket quantity must be >= 0.' } as const;

    tickets.push({ type: resolvedType, price, quantity });
  }

  if (tickets.length === 0) {
    return { error: 'At least one ticket is required.' } as const;
  }

  const minPrice = Math.min(...tickets.map((t) => t.price));
  const totalCapacity = tickets.reduce((sum, t) => sum + t.quantity, 0);

  return { tickets, minPrice, totalCapacity } as const;
};

export const load: PageServerLoad = async ({ locals }) => {
  const { user, role } = await getUserAndRole(locals);
  if (!user) throw redirect(303, '/login?redirect=/organizer');

  if (!isAllowedRole(role)) {
    const { data: organizer, error: orgError } = await locals.supabase
      .from('organizers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (orgError) console.error('[organizer] fetch organizer error', orgError.message);

    return {
      user,
      role,
      mode: 'apply',
      isOrganizer: false,
      organizer: organizer ?? null
    };
  }

  const { data: events, error: eventsError } = await locals.supabase
    .from('events')
    .select('*, tickets(*)')
    .eq('organizer_id', user.id)
    .order('start_date', { ascending: true });
  if (eventsError) console.error('[organizer] load events error', eventsError.message);

  const { data: categories, error: categoriesError } = await locals.supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true });
  if (categoriesError) console.error('[organizer] load categories error', categoriesError.message);

  return {
    user,
    role,
    mode: 'manage',
    isOrganizer: true,
    events: events ?? [],
    categories: categories ?? []
  };
};

export const actions: Actions = {
  applyOrganizer: async (event) => {
    const { user, role } = await getUserAndRole(event.locals);
    if (!user) throw redirect(303, '/login?redirect=/organizer');
    if (role !== 'user') return fail(403, { message: 'Only regular users can apply.' });

    const form = await event.request.formData();
    const company_name = (form.get('company_name') as string)?.trim();
    const description = (form.get('description') as string)?.trim();
    const contact_phone = (form.get('contact_phone') as string)?.trim();
    const website_url = (form.get('website_url') as string)?.trim();

    if (!company_name) return fail(400, { message: 'Organization / brand name is required.' });

    const { error: upsertError } = await event.locals.supabase
      .from('organizers')
      .upsert(
        {
          user_id: user.id,
          company_name,
          description,
          contact_email: user.email,
          contact_phone,
          website_url,
          verified: false,
          verification_date: null
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('[organizer] apply upsert error', upsertError.message);
      return fail(500, { message: upsertError.message });
    }

    throw redirect(303, '/organizer');
  },

  createEvent: async (event) => {
    const { user, role } = await getUserAndRole(event.locals);
    if (!user) throw redirect(303, '/login?redirect=/organizer');
    if (!isAllowedRole(role)) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const title = (form.get('title') as string)?.trim();
    const description = (form.get('description') as string)?.trim();
    const city = (form.get('city') as string)?.trim();
    const customCity = (form.get('custom_city') as string)?.trim();
    const venue = (form.get('venue') as string)?.trim();
    const start_date = (form.get('start_date') as string)?.trim();
    const end_date = (form.get('end_date') as string)?.trim();
    const imageUrlInput = (form.get('image_url') as string)?.trim();
    const imageFile = form.get('image_file') as File | null;
    const categoryIdRaw = form.get('category_id') as string;
    const category_id = categoryIdRaw ? categoryIdRaw : null;

    if (!title || !city || !start_date || !end_date) {
      return fail(400, { message: 'Required fields missing.' });
    }

    const ticketsResult = parseTickets(form);
    if ('error' in ticketsResult) return fail(400, { message: ticketsResult.error });
    const { tickets, minPrice, totalCapacity } = ticketsResult;

    const slug = makeUniqueSlug(title);
    const location = buildLocation(city, customCity, venue);

    let finalImageUrl = imageUrlInput || '';
    if (imageFile && imageFile.size > 0) {
      const uniquePath = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await event.locals.supabase.storage
        .from('event-images')
        .upload(uniquePath, imageFile, { upsert: false });
      if (uploadError) {
        console.error('[organizer] image upload error', uploadError.message);
        return fail(500, { message: 'Image upload failed' });
      }
      const { data: publicData } = event.locals.supabase.storage.from('event-images').getPublicUrl(uniquePath);
      finalImageUrl = publicData.publicUrl || finalImageUrl;
    }

    const { data: insertedEvent, error: insertError } = await event.locals.supabase
      .from('events')
      .insert({
        title,
        slug,
        description,
        location,
        start_date,
        end_date,
        image_url: finalImageUrl,
        price: minPrice,
        capacity: totalCapacity,
        organizer_id: user.id,
        category_id
      })
      .select('id')
      .single();

    if (insertError || !insertedEvent?.id) {
      console.error('[organizer] createEvent error', insertError?.message);
      return fail(500, { message: insertError?.message || 'Failed to create event' });
    }

    const ticketRows = tickets.map((t) => ({
      event_id: insertedEvent.id,
      type: t.type,
      price: t.price,
      quantity: t.quantity
    }));

    const { error: ticketsError } = await event.locals.supabase.from('tickets').insert(ticketRows);
    if (ticketsError) {
      console.error('[organizer] tickets insert error', ticketsError.message);
      return fail(500, { message: ticketsError.message });
    }

    throw redirect(303, '/organizer');
  },

  updateEvent: async (event) => {
    const { user, role } = await getUserAndRole(event.locals);
    if (!user) throw redirect(303, '/login?redirect=/organizer');
    if (!isAllowedRole(role)) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const id = (form.get('id') as string) ?? '';
    if (!id) return fail(400, { message: 'Missing event id' });

    const updates: Record<string, unknown> = {};
    const title = (form.get('title') as string) ?? '';
    if (title) {
      const trimmed = title.trim();
      updates.title = trimmed;
      updates.slug = makeUniqueSlug(trimmed);
    }

    const city = (form.get('city') as string)?.trim();
    const customCity = (form.get('custom_city') as string)?.trim();
    const venue = (form.get('venue') as string)?.trim();
    if (city || customCity || venue) {
      const location = buildLocation(city || '', customCity || '', venue || '');
      updates.location = location;
    }

    ['description', 'start_date', 'end_date', 'image_url'].forEach((field) => {
      const val = (form.get(field) as string) ?? '';
      if (val) updates[field] = val.trim();
    });

    const categoryIdRaw = form.get('category_id') as string;
    if (categoryIdRaw !== null && categoryIdRaw !== undefined) {
      updates.category_id = categoryIdRaw ? categoryIdRaw : null;
    }

    const ticketsResult = parseTickets(form);
    if ('error' in ticketsResult) return fail(400, { message: ticketsResult.error });
    const { tickets, minPrice, totalCapacity } = ticketsResult;
    updates.price = minPrice;
    updates.capacity = totalCapacity;

    const { error: updateError } = await event.locals.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .eq('organizer_id', user.id);
    if (updateError) {
      console.error('[organizer] updateEvent error', updateError.message);
      return fail(500, { message: updateError.message });
    }

    const { error: deleteTicketsError } = await event.locals.supabase.from('tickets').delete().eq('event_id', id);
    if (deleteTicketsError) {
      console.error('[organizer] delete old tickets error', deleteTicketsError.message);
      return fail(500, { message: deleteTicketsError.message });
    }

    const ticketRows = tickets.map((t) => ({
      event_id: id,
      type: t.type,
      price: t.price,
      quantity: t.quantity
    }));
    const { error: insertTicketsError } = await event.locals.supabase.from('tickets').insert(ticketRows);
    if (insertTicketsError) {
      console.error('[organizer] insert new tickets error', insertTicketsError.message);
      return fail(500, { message: insertTicketsError.message });
    }

    throw redirect(303, '/organizer');
  },

  deleteEvent: async (event) => {
    const { user, role } = await getUserAndRole(event.locals);
    if (!user) throw redirect(303, '/login?redirect=/organizer');
    if (!isAllowedRole(role)) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const id = (form.get('id') as string) ?? '';
    if (!id) return fail(400, { message: 'Missing event id' });

    const { error: deleteError } = await event.locals.supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('organizer_id', user.id);

    if (deleteError) {
      console.error('[organizer] deleteEvent error', deleteError.message);
      return fail(500, { message: deleteError.message });
    }

    throw redirect(303, '/organizer');
  }
};
