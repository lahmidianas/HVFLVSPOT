// @ts-nocheck
// src/routes/wallet/+page.server.ts
import type { PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const session = await locals.getSession?.();

  if (!session) {
    return {
      tickets: [],
      error: null
    };
  }

  const supabase = locals.supabase;
  const userId = session.user.id;

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      quantity,
      total_price,
      status,
      created_at,
      qr_code,
      qr_redeemed,
      events:events (
        id,
        title,
        description,
        start_date,
        location,
        image_url
      ),
      tickets:tickets (
        id,
        type,
        price
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[wallet] failed to load tickets', error.message);
  }

  return {
    tickets: data ?? [],
    error: error ? 'Unable to load tickets. Please try again.' : null
  };
};
