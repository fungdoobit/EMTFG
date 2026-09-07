import { createClient } from "@supabase/supabase-js";

// Public, read-only client: uses the anon key, which only has the "public
// read" RLS policies from supabase/schema.sql to work with. Safe to use
// anywhere (Server or Client Components) — it can never write.
export function createReadOnlyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project's values."
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
