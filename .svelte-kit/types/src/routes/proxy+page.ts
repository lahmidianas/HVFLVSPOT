// @ts-nocheck
import { supabase } from '$lib/supabase';
import type { PageLoad } from './$types';

export const load = async () => {
  // Get session for authentication state
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    session
  };
};;null as any as PageLoad;