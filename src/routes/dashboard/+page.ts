import { supabase } from '$lib/supabase';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    session
  };
};