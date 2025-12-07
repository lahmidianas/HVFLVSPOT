// @ts-nocheck
// src/routes/dashboard/+page.server.ts
import type { PageServerLoad, Actions } from './$types';

const ADMIN_EMAIL = 'anaslahmidi123@gmail.com';

const normalizeEmail = (email?: string | null) => (email ?? '').trim().toLowerCase();

// simple slug helper
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with -
    .replace(/^-+|-+$/g, ''); // trim leading/trailing -

const resolveEmail = async (locals: any) => {
  // 1) try session via getSession
  if (locals?.supabase) {
    const { data, error } = await locals.supabase.auth.getSession();
    if (error) {
      console.error('[dashboard] supabase.auth.getSession error', error.message);
    }
    const sessionEmail = data?.session?.user?.email;
    if (sessionEmail) return normalizeEmail(sessionEmail);
  }

  // 2) optional helper
  if (typeof locals?.getSession === 'function') {
    try {
      const session = await locals.getSession();
      const email = session?.user?.email;
      if (email) return normalizeEmail(email);
    } catch (err) {
      console.error('[dashboard] locals.getSession error', err);
    }
  }

  // 3) fallback getUser (may warn about auth)
  if (locals?.supabase) {
    const { data, error } = await locals.supabase.auth.getUser();
    if (error) {
      console.error('[dashboard] supabase.auth.getUser error', error.message);
    }
    const userEmail = data?.user?.email;
    if (userEmail) return normalizeEmail(userEmail);
  }

  return '';
};

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const email = await resolveEmail(locals);
  const isAdmin = email === ADMIN_EMAIL;

  const supabase = locals.supabase;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(', tickets()')
    .order('start_date', { ascending: true });

  if (eventsError) {
    console.error('[dashboard load] events error', eventsError.message);
  }

  const { data: tickets, error: ticketsError } = await supabase.from('tickets').select('*');
  if (ticketsError) {
    console.error('[dashboard load] tickets error', ticketsError.message);
  }

  return {
    isAdmin,
    events: events ?? [],
    tickets: tickets ?? []
  };
};

export const actions = {
  createEvent: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) {
      return { status: 403, body: { message: 'Access denied' } } as any;
    }

    const form = await event.request.formData();

    const title = (form.get('title') as string)?.trim();
    const description = (form.get('description') as string)?.trim();
    const location = (form.get('location') as string)?.trim();
    const start_date_raw = (form.get('start_date') as string)?.trim();
    const end_date_raw = (form.get('end_date') as string)?.trim();
    const image_url = (form.get('image_url') as string)?.trim();
    const price = Number(form.get('price') ?? 0);
    const capacity = Number(form.get('capacity') ?? 0);

    if (!title || !location || !start_date_raw || !end_date_raw) {
      return { status: 400, body: { message: 'Required fields missing.' } } as any;
    }

    // convert from "YYYY-MM-DDTHH:MM" (datetime-local) into ISO if you want,
    // Postgres can also parse the raw string, but this keeps it clean:
    const start_date = new Date(start_date_raw).toISOString();
    const end_date = new Date(end_date_raw).toISOString();

    // generate a unique slug based on the title
    const baseSlug = slugify(title);
    const uniqueSlug = '${baseSlug}-${Date.now().toString(36)}';

    const { error: insertError } = await event.locals.supabase.from('events').insert({
      title,
      slug: uniqueSlug,
      description,
      location,
      start_date,
      end_date,
      image_url,
      price,
      capacity,
      organizer_id: null
    });

    if (insertError) {
      console.error('[dashboard] createEvent error', insertError);
      return { status: 500, body: { message: insertError.message } } as any;
    }

    console.log('[dashboard] event created successfully with slug', uniqueSlug);
    return { success: true } as any;
  },

  updateEvent: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) {
      return { status: 403, body: { message: 'Access denied' } } as any;
    }

    const form = await event.request.formData();
    const id = form.get('id') as string;
    if (!id) return { status: 400, body: { message: 'Missing event id' } } as any;

    const updates: Record<string, unknown> = {};
    ['title', 'description', 'location', 'start_date', 'end_date', 'image_url'].forEach((field) => {
      const val = form.get(field) as string;
      if (val !== null && val !== undefined) {
        updates[field] = val;
      }
    });
    if (form.has('price')) updates.price = Number(form.get('price'));
    if (form.has('capacity')) updates.capacity = Number(form.get('capacity'));

    const { error: updateError } = await event.locals.supabase.from('events').update(updates).eq('id', id);
    if (updateError) {
      console.error('[dashboard] updateEvent error', updateError.message);
      return { status: 500, body: { message: updateError.message } } as any;
    }
    return { success: true } as any;
  },

  deleteEvent: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) {
      return { status: 403, body: { message: 'Access denied' } } as any;
    }

    const form = await event.request.formData();
    const id = form.get('id') as string;
    if (!id) return { status: 400, body: { message: 'Missing event id' } } as any;

    const { error: deleteError } = await event.locals.supabase.from('events').delete().eq('id', id);
    if (deleteError) {
      console.error('[dashboard] deleteEvent error', deleteError.message);
      return { status: 500, body: { message: deleteError.message } } as any;
    }
    return { success: true } as any;
  }
};;null as any as Actions;