import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when both public Supabase values are present. The app still renders
 * without them — sign-in simply reports that it is not configured yet, which
 * keeps local development possible with an empty .env.local.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client. The anon/publishable key is designed to ship to the browser:
 * it grants nothing on its own, and Row Level Security decides what the
 * signed-in user may read or write.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
