import { SupabaseClient, Session } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      getSession(): Promise<Session | null>
      role: string | null
    }
    interface PageData {
      session: Session | null
      role?: string | null
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
