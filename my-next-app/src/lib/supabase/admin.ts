import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client using Service Role Key
 * ONLY use this in server-side API routes, Server Actions, or scripts.
 * Never expose this client or the service role key to the browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
    console.warn(
      "[Supabase Admin Warning] SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. " +
        "Falling back to anon key. Admin auth actions (e.g. auth.admin.createUser) require service_role key."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
