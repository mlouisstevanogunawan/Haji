import { createClient } from "@/lib/supabase/server";
import { buildSessionUser } from "@/lib/auth/user";

export { buildSessionUser };
export type { SessionUser, UserRole } from "@/lib/auth/roles";

/**
 * User aktif untuk Server Component dan Route Handler (cookie request yang
 * sama). Mengembalikan null bila token tidak valid di Supabase Auth.
 */
export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return buildSessionUser(supabase, user);
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await getSessionUser();
  return session?.id ?? null;
}
