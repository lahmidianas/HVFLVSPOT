import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const isAllowedRole = (role?: string | null) => role === 'organizer' || role === 'admin';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildLocation = (city?: string | null, venue?: string | null) => {
  const c = (city ?? '').trim();
  const v = (venue ?? '').trim();
  if (c && v) return `${c} - ${v}`;
  return c || v || '';
};

async function getUserAndRole(locals: any) {
  const { data: authData, error: authError } = await locals.supabase.auth.getUser();
  if (authError) {
    console.error('[organizer] auth error', authError.message);
  }
  const user = authData?.user;
  if (!user) return { user: null, role: null };

  const { data: dbUser, error: dbError } = await locals.supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (dbError) {
    console.error('[organizer] users role fetch error', dbError.message);
  }

  return { user, role: dbUser?.role ?? null };
}

export const load: PageServerLoad = async ({ locals }) => {
  const { user, role } = await getUserAndRole(locals);

  if (!user) {
    throw redirect(303, '/login?redirect=/organizer');
  }

  if (!isAllowedRole(role)) {
    throw error(403, 'Access denied');
  }

  const { data: events, error: eventsError } = await locals.supabase
    .from('events')
    .select('*, tickets(*)')
    .eq('organizer_id', user.id)
    .order('start_date', { ascending: true });

  if (eventsError) {
    console.error('[organizer] load events error', eventsError.message);
  }

  return {
    user,
    role,
    isOrganizer: true,
    events: events ?? []
  };
};

export const actions: Actions = {
  createEvent: async (event) => {
    const { user, role } = await getUserAndRole(event.locals);
    if (!user) throw redirect(303, '/login?redirect=/organizer');
    if (!isAllowedRole(role)) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const title = (form.get('title') as string)?.trim();
    const description = (form.get('description') as string)?.trim();
    const city = (form.get('city') as string)?.trim();
    const venue = (form.get('venue') as string)?.trim();
    const start_date = (form.get('start_date') as string)?.trim();
    const end_date = (form.get('end_date') as string)?.trim();
    const imageUrlInput = (form.get('image_url') as string)?.trim();
    const imageFile = form.get('image_file') as File | null;
    const price = Number(form.get('price') ?? 0);
    const capacity = Number(form.get('capacity') ?? 0);

    if (!title || !city || !start_date || !end_date) {
      return fail(400, { message: 'Required fields missing.' });
    }

    // Tickets
    const ticketTypes = form.getAll('ticket_type[]').map((v) => (v as string)?.trim());
    const ticketPrices = form.getAll('ticket_price[]').map((v) => Number(v));
    const ticketQuantities = form.getAll('ticket_quantity[]').map((v) => Number(v));

    if (ticketTypes.length === 0) {
      return fail(400, { message: 'At least one ticket type is required.' });
    }

    for (let i = 0; i < ticketTypes.length; i++) {
      if (!ticketTypes[i]) return fail(400, { message: 'Ticket type cannot be empty.' });
      const p = ticketPrices[i];
      const q = ticketQuantities[i];
      if (Number.isNaN(p) || p < 0) return fail(400, { message: 'Ticket price must be >= 0.' });
      if (!Number.isFinite(q) || q < 0) return fail(400, { message: 'Ticket quantity must be >= 0.' });
    }

    const baseSlug = slugify(title);
    const slug = baseSlug || `event-${Date.now()}`;
    const location = buildLocation(city, venue);

    // Handle image upload if provided
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
      const { data: publicData } = event.locals.supabase.storage
        .from('event-images')
        .getPublicUrl(uniquePath);
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
        price: Number.isNaN(price) ? 0 : price,
        capacity: Number.isNaN(capacity) ? 0 : capacity,
        organizer_id: user.id
      })
      .select('id')
      .single();

    if (insertError || !insertedEvent?.id) {
      console.error('[organizer] createEvent error', insertError?.message);
      return fail(500, { message: insertError?.message || 'Failed to create event' });
    }

    const eventId = insertedEvent.id;

    const ticketRows = ticketTypes.map((type, idx) => ({
      event_id: eventId,
      type,
      price: Number.isNaN(ticketPrices[idx]) ? 0 : ticketPrices[idx],
      quantity: Number.isNaN(ticketQuantities[idx]) ? 0 : ticketQuantities[idx]
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
      updates.title = title.trim();
      updates.slug = slugify(title) || `event-${Date.now()}`;
    }
    const city = (form.get('city') as string)?.trim();
    const venue = (form.get('venue') as string)?.trim();
    const location = buildLocation(city, venue);
    if (location) updates.location = location;

    ['description', 'start_date', 'end_date', 'image_url'].forEach((field) => {
      const val = (form.get(field) as string) ?? '';
      if (val) updates[field] = val.trim();
    });
    if (form.has('price')) {
      const priceVal = Number(form.get('price'));
      updates.price = Number.isNaN(priceVal) ? 0 : priceVal;
    }
    if (form.has('capacity')) {
      const capacityVal = Number(form.get('capacity'));
      updates.capacity = Number.isNaN(capacityVal) ? 0 : capacityVal;
    }

    const { error: updateError } = await event.locals.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .eq('organizer_id', user.id);

    if (updateError) {
      console.error('[organizer] updateEvent error', updateError.message);
      return fail(500, { message: updateError.message });
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
