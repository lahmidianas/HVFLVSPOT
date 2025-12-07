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

  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
  });
  return response;
};
