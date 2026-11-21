import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient({ supabaseUrl, publishableKey }) {
  if (!supabaseUrl || !publishableKey) {
    throw new Error("Supabase URL and publishable key are required.");
  }

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    global: {
      headers: {
        "X-Client-Info": "lets-talk-backend/1.0.0"
      }
    }
  });
}
