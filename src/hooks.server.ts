import { createServerClient } from '@supabase/auth-helpers-sveltekit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

if (!PUBLIC_SUPABASE_URL) throw new Error('Missing PUBLIC_SUPABASE_URL');
if (!PUBLIC_SUPABASE_ANON_KEY) throw new Error('Missing PUBLIC_SUPABASE_ANON_KEY');

export const handle: Handle = async ({ event, resolve }) => {
  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (name) => event.cookies.get(name),
      set: (name, value, options) => event.cookies.set(name, value, { path: '/', ...options }),
      remove: (name, options) => event.cookies.delete(name, { path: '/', ...options })
    }
  });

  event.locals.supabase = supabase;
  event.locals.getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[supabase] getSession error', error.message);
      return null;
    }
    return data.session;
  };
  // Resolve role for the current user (used for role-based redirects/navigation)
  const session = await event.locals.getSession();
  if (session?.user?.id) {
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();
    if (roleError) {
      console.error('[supabase] get role error', roleError.message);
    }
    event.locals.role = roleData?.role ?? null;
  } else {
    event.locals.role = null;
  }

  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
  });
  return response;
};
export const csrf = {
  checkOrigin: false
};
