// @ts-nocheck
import { supabase } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    session
  };
};;null as any as LayoutLoad;