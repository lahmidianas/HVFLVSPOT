// @ts-nocheck
import { supabase } from '$lib/supabase';
import type { PageLoad } from './$types';

export const load = async ({ params }: Parameters<PageLoad>[0]) => {
  return {
    eventId: params.id
  };
};