import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { ticketApi } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  try {
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw redirect(302, '/login?redirect=/wallet');
    }

    // Fetch user tickets using the API client
    const tickets = await ticketApi.getUserTickets();

    return {
      tickets: tickets || [],
      error: null
    };
  } catch (error) {
    if (error.status === 302) {
      throw error; // Re-throw redirects
    }
    
    return {
      tickets: [],
      error: 'Unable to load your tickets'
    };
  }
};