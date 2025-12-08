// @ts-nocheck
import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const isAllowedRole = (role?: string | null) => role === 'organizer' || role === 'admin';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function getUserAndRole(locals: App.Locals) {
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

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
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

export const actions = {
  createEvent: async (event: import('./$types').RequestEvent) => {
    const { user, role } = await getUserAndRole(event.locals);
    if (!user) throw redirect(303, '/login?redirect=/organizer');
    if (!isAllowedRole(role)) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const title = (form.get('title') as string)?.trim();
    const description = (form.get('description') as string)?.trim();
    const location = (form.get('location') as string)?.trim();
    const start_date = (form.get('start_date') as string)?.trim();
    const end_date = (form.get('end_date') as string)?.trim();
    const image_url = (form.get('image_url') as string)?.trim();
    const price = Number(form.get('price') ?? 0);
    const capacity = Number(form.get('capacity') ?? 0);

    if (!title || !location || !start_date || !end_date) {
      return fail(400, { message: 'Required fields missing.' });
    }

    const baseSlug = slugify(title);
    const slug = baseSlug || `event-${Date.now()}`;

    const { error: insertError } = await event.locals.supabase.from('events').insert({
      title,
      slug,
      description,
      location,
      start_date,
      end_date,
      image_url,
      price: Number.isNaN(price) ? 0 : price,
      capacity: Number.isNaN(capacity) ? 0 : capacity,
      organizer_id: user.id
    });

    if (insertError) {
      console.error('[organizer] createEvent error', insertError.message);
      return fail(500, { message: insertError.message });
    }

    return { success: true };
  },

  updateEvent: async (event: import('./$types').RequestEvent) => {
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
    ['description', 'location', 'start_date', 'end_date', 'image_url'].forEach((field) => {
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

    return { success: true };
  },

  deleteEvent: async (event: import('./$types').RequestEvent) => {
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

    return { success: true };
  }
};
;null as any as Actions;