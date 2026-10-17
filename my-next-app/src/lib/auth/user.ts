import type { SessionUser, UserRole } from "@/lib/auth/roles";
import { normalizeRole, ROLE_HOME_PATH } from "@/lib/auth/roles";

export type { SessionUser, UserRole } from "@/lib/auth/roles";

interface AuthUserLike {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}

// SupabaseClient dipakai lewat `any` karena rantai builder PostgREST sangat
// dalam; menyempitkannya di sini memicu TS2589.
interface ProfileReader {
  from(table: string): any;
}

/**
 * Bangun identitas sesi dari user Supabase Auth + baris profiles.
 *
 * Peran diambil dari profiles.role (sumber kebenaran). Kalau baris profiles
 * belum ada atau isinya peran yang tidak dikenal, peran terendah dipakai supaya
 * pengguna tidak terkunci di luar aplikasi sekaligus tidak diberi hak lebih.
 */
export async function buildSessionUser(
  supabase: ProfileReader,
  user: AuthUserLike
): Promise<SessionUser> {
  let rawRole = "";
  let name = user.user_metadata?.full_name || user.user_metadata?.name || "";

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      rawRole = profile.role || "";
      name = profile.full_name || name;
    }
  } catch {
    // Baca profiles gagal (RLS/koneksi): tetap pakai identitas dari token.
  }

  const role: UserRole =
    normalizeRole(rawRole) ||
    normalizeRole(user.user_metadata?.role) ||
    "jamaah_umroh";

  return {
    id: user.id,
    email: user.email || "",
    name: name || (user.email ? user.email.split("@")[0] : "Pengguna"),
    role,
    rawRole: rawRole || role,
    homePath: ROLE_HOME_PATH[role],
  };
}
