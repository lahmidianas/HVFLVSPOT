//src/routes/dashboard/users/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

const ALLOWED_ROLES = ['user', 'organizer', 'admin'] as const;

export const load: PageServerLoad = async ({ locals }) => {
  const { data: authData, error: authError } = await locals.supabase.auth.getUser();
  if (authError) {
    throw error(500, 'Failed to fetch current user');
  }

  const authUser = authData?.user;
  if (!authUser) {
    throw redirect(303, '/login?redirect=/dashboard/users');
  }

  const { data: dbUser, error: dbError } = await locals.supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (dbError) {
    throw error(500, 'Failed to fetch user role');
  }

  if (dbUser?.role !== 'admin') {
    throw error(403, 'Access denied');
  }

  const { data: users, error: usersError } = await locals.supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });

  if (usersError) {
    throw error(500, 'Failed to fetch users');
  }

  const { data: organizers, error: organizersError } = await locals.supabase
    .from('organizers')
    .select('id, user_id, company_name, verified');

  if (organizersError) {
    throw error(500, 'Failed to fetch organizers');
  }

  const organizerByUser = new Map((organizers ?? []).map((org) => [org.user_id, org]));

  const mergedUsers = (users ?? []).map((user) => {
    const org = organizerByUser.get(user.id);
    return {
      ...user,
      organizer_company: org?.company_name ?? null,
      organizer_verified: org?.verified ?? false
    };
  });

  return {
    users: mergedUsers
  };
};

export const actions: Actions = {
  updateRole: async ({ locals, request }) => {
    const { data: authData, error: authError } = await locals.supabase.auth.getUser();
    if (authError) {
      return fail(500, { message: 'Failed to fetch current user.' });
    }

    const currentUser = authData?.user;
    if (!currentUser) {
      throw redirect(303, '/login?redirect=/dashboard/users');
    }

    const { data: dbUser, error: dbError } = await locals.supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (dbError) {
      return fail(500, { message: 'Failed to fetch user role.' });
    }

    if (dbUser?.role !== 'admin') {
      return fail(403, { message: 'Access denied.' });
    }

    const form = await request.formData();
    const userId = (form.get('user_id') as string) ?? '';
    const role = ((form.get('role') as string) ?? '').trim().toLowerCase();

    if (!userId || !(ALLOWED_ROLES as readonly string[]).includes(role)) {
      return fail(400, { message: 'Invalid user or role.' });
    }

    if (userId === currentUser.id && role !== 'admin') {
      return fail(400, { message: 'You cannot remove your own admin role.' });
    }

    const { data: updatedUser, error: updateError } = await locals.supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, email, full_name')
      .single();

    if (updateError) {
    console.error('[users] role update error', updateError);
    return fail(500, { message: updateError.message || 'Failed to update role.' });
    }

    if (role === 'organizer') {
      const { data: existingOrg, error: orgFetchError } = await locals.supabase
        .from('organizers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (orgFetchError && orgFetchError.code !== 'PGRST116') {
        return fail(500, { message: 'Failed to ensure organizer profile.' });
      }

      if (!existingOrg) {
        const companyName = updatedUser?.full_name || updatedUser?.email || 'Organizer';
        const contactEmail = updatedUser?.email || null;

        const { error: insertOrgError } = await locals.supabase
          .from('organizers')
          .insert({
            user_id: userId,
            company_name: companyName,
            contact_email: contactEmail
          });

        if (insertOrgError) {
          return fail(500, { message: 'Failed to create organizer profile.' });
        }
      }
    }

    return { success: true, message: 'Role updated.' };
  }
};
