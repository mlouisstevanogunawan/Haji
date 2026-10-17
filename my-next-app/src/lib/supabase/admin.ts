import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client using Service Role Key
 * ONLY use this in server-side API routes, Server Actions, or scripts.
 * Never expose this client or the service role key to the browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  // Sengaja TIDAK fallback ke anon key. Anon key tunduk pada RLS, jadi tulis
  // akan berakhir 0 baris tanpa error yang kelihatan — persis bug yang membuat
  // form seolah-olah gagal menyimpan. Lebih baik gagal keras di sini.
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum di-set. Ambil nilai 'service_role' di " +
        "Supabase Dashboard → Project Settings → API → Project API keys, lalu " +
        "tambahkan sebagai SUPABASE_SERVICE_ROLE_KEY di .env.local dan pada " +
        "Environment Variables deployment (Vercel)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
