import "server-only";
import { createClient } from "@supabase/supabase-js";

// Privileged client: uses the service role key, which bypasses Row Level
// Security entirely. Only ever call this from Server Actions, and only
// after checking isUnlocked() from lib/auth.ts — this client has no
// concept of the passcode itself, it just has full write access to
// every table.
//
// The `server-only` import throws a build error if this file is ever
// pulled into a Client Component bundle, so the service role key can't
// leak to the browser by accident.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill in your Supabase project's values."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
