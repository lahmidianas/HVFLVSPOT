import { supabase } from '$lib/supabase';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // Get session for authentication state
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    session
  };
};