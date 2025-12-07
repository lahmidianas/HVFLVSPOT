import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

const sessionStore = writable<Session | null>(null);
export const session = sessionStore;

let initialized = false;

export async function initSession(initial?: Session | null) {
  if (initialized) {
    if (typeof initial !== 'undefined') {
      sessionStore.set(initial);
    }
    return;
  }

  initialized = true;

  if (typeof initial !== 'undefined') {
    sessionStore.set(initial);
  }

  if (!browser) return;

  const { data } = await supabase.auth.getSession();
  sessionStore.set(data.session ?? initial ?? null);

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    sessionStore.set(nextSession);
  });
}

export { sessionStore };
