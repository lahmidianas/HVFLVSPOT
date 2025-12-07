import type { RequestEvent } from '@sveltejs/kit';

export async function getCurrentUserAndRole(event: RequestEvent) {
  const { data: userResult, error: userError } = await event.locals.supabase.auth.getUser();

  if (userError || !userResult?.user) {
    console.error('[auth] getUser error', userError?.message);
    return { user: null, role: null };
  }

  const authUser = userResult.user;
  const { data: profile, error: profileError } = await event.locals.supabase
    .from('users')
    .select('id,email,role')
    .eq('id', authUser.id)
    .single();

  console.log('[auth] getCurrentUserAndRole', {
    authId: authUser.id,
    authEmail: authUser.email,
    dbUserId: profile?.id,
    dbUserEmail: profile?.email,
    dbUserRole: profile?.role
  });

  if (profileError || !profile) {
    console.error('[auth] profile fetch error', profileError?.message);
    return { user: null, role: null };
  }

  return { user: profile, role: profile.role ?? null };
}
