// supabase.js
import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  if (typeof window === "undefined") return null;

  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

export const supabase = createSupabaseClient();
