// @ts-nocheck
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail, error } from '@sveltejs/kit';

const ADMIN_EMAIL = 'anaslahmidi123@gmail.com';
const normalizeEmail = (email?: string | null) => (email ?? '').trim().toLowerCase();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const resolveEmail = async (locals: any) => {
  if (locals?.supabase) {
    const { data, error: sessError } = await locals.supabase.auth.getSession();
    if (sessError) console.error('[dashboard] supabase.auth.getSession error', sessError.message);
    const sessionEmail = data?.session?.user?.email;
    if (sessionEmail) return normalizeEmail(sessionEmail);
  }

  if (typeof locals?.getSession === 'function') {
    try {
      const session = await locals.getSession();
      const email = session?.user?.email;
      if (email) return normalizeEmail(email);
    } catch (err) {
      console.error('[dashboard] locals.getSession error', err);
    }
  }

  if (locals?.supabase) {
    const { data, error: userError } = await locals.supabase.auth.getUser();
    if (userError) console.error('[dashboard] supabase.auth.getUser error', userError.message);
    const userEmail = data?.user?.email;
    if (userEmail) return normalizeEmail(userEmail);
  }

  return '';
};

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const session = await locals.getSession();
  const email = await resolveEmail(locals);
  const isAdmin = email === ADMIN_EMAIL;
  const role = locals.role ?? null;
  const isOrganizer = role === 'organizer';

  // Organizer homepage does not need admin datasets
  if (isOrganizer) {
    return {
      isAdmin: false,
      isOrganizer: true,
      displayName:
        (session?.user?.user_metadata?.full_name as string) ||
        (session?.user?.user_metadata?.name as string) ||
        session?.user?.email?.split('@')[0] ||
        'Organizer'
    };
  }

  const supabase = locals.supabase;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*, tickets(*)')
    .order('start_date', { ascending: true });
  if (eventsError) console.error('[dashboard load] events error', eventsError.message);

  const { data: tickets, error: ticketsError } = await supabase.from('tickets').select('*');
  if (ticketsError) console.error('[dashboard load] tickets error', ticketsError.message);

  const { data: pendingOrganizers, error: orgError } = await supabase
    .from('organizers')
    .select('id, user_id, company_name, contact_email, contact_phone, website_url, created_at')
    .eq('verified', false)
    .order('created_at', { ascending: true });
  if (orgError) console.error('[dashboard load] pending organizers error', orgError.message);

  return {
    isAdmin,
    isOrganizer: false,
    displayName:
      (session?.user?.user_metadata?.full_name as string) ||
      (session?.user?.user_metadata?.name as string) ||
      session?.user?.email?.split('@')[0] ||
      'Admin',
    events: events ?? [],
    tickets: tickets ?? [],
    pendingOrganizers: pendingOrganizers ?? []
  };
};

export const actions = {
  createEvent: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) return fail(403, { message: 'Access denied' });

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
      return fail(400, { message: 'Required fields missing.' });
    }

    const start_date = new Date(start_date_raw).toISOString();
    const end_date = new Date(end_date_raw).toISOString();
    const uniqueSlug = `${slugify(title)}-${Date.now().toString(36)}`;

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
      return fail(500, { message: insertError.message });
    }

    return { success: true } as any;
  },

  updateEvent: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const id = form.get('id') as string;
    if (!id) return fail(400, { message: 'Missing event id' });

    const updates: Record<string, unknown> = {};
    ['title', 'description', 'location', 'start_date', 'end_date', 'image_url'].forEach((field) => {
      const val = form.get(field) as string;
      if (val !== null && val !== undefined && val !== '') updates[field] = val;
    });
    if (form.has('price')) updates.price = Number(form.get('price'));
    if (form.has('capacity')) updates.capacity = Number(form.get('capacity'));

    const { error: updateError } = await event.locals.supabase.from('events').update(updates).eq('id', id);
    if (updateError) {
      console.error('[dashboard] updateEvent error', updateError.message);
      return fail(500, { message: updateError.message });
    }
    return { success: true } as any;
  },

  deleteEvent: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const id = form.get('id') as string;
    if (!id) return fail(400, { message: 'Missing event id' });

    const { error: deleteError } = await event.locals.supabase.from('events').delete().eq('id', id);
    if (deleteError) {
      console.error('[dashboard] deleteEvent error', deleteError.message);
      return fail(500, { message: deleteError.message });
    }
    return { success: true } as any;
  },

  approveOrganizer: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const organizerId = form.get('organizer_id') as string;
    if (!organizerId) return fail(400, { message: 'Missing organizer id' });

    const { error: updateError } = await event.locals.supabase
      .from('organizers')
      .update({ verified: true, verification_date: new Date().toISOString() })
      .eq('id', organizerId);
    if (updateError) {
      console.error('[dashboard] approve organizer error', updateError.message);
      return fail(500, { message: updateError.message });
    }

    throw redirect(303, '/dashboard');
  },

  removeOrganizer: async (event: import('./$types').RequestEvent) => {
    const email = await resolveEmail(event.locals);
    const isAdmin = email === ADMIN_EMAIL;
    if (!isAdmin) return fail(403, { message: 'Access denied' });

    const form = await event.request.formData();
    const organizerId = form.get('organizer_id') as string;
    if (!organizerId) return fail(400, { message: 'Missing organizer id' });

    const { error: deleteError } = await event.locals.supabase.from('organizers').delete().eq('id', organizerId);
    if (deleteError) {
      console.error('[dashboard] remove organizer error', deleteError.message);
      return fail(500, { message: deleteError.message });
    }

    throw redirect(303, '/dashboard');
  }
};
;null as any as Actions;