export type UserRole =
  | "super_admin"
  | "admin_cabang"
  | "mitra_agen"
  | "jamaah_umroh"
  | "muthawif";

/**
 * Nilai kolom profiles.role di database tidak seragam (migration lama memakai
 * 'jamaah', 'admin', sementara UI memakai 'jamaah_umroh', 'admin_cabang').
 * Peta ini menyatukannya agar satu sesi punya satu peran aplikasi.
 */
const ROLE_ALIASES: Record<string, UserRole> = {
  admin: "admin_cabang",
  admin_cabang: "admin_cabang",
  admin_operasional: "admin_cabang",
  staff_dokumen: "admin_cabang",
  super_admin: "super_admin",
  superadmin: "super_admin",
  mitra_agen: "mitra_agen",
  agen: "mitra_agen",
  agent: "mitra_agen",
  muthawif: "muthawif",
  guide: "muthawif",
  jamaah: "jamaah_umroh",
  jamaah_umroh: "jamaah_umroh",
  pilgrim: "jamaah_umroh",
};

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Nilai mentah profiles.role, dipakai policy RLS dan badge. */
  rawRole: string;
  homePath: string;
}

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  super_admin: "/super-admin/dashboard",
  admin_cabang: "/admin/dashboard",
  mitra_agen: "/agen/dashboard",
  muthawif: "/muthawif/dashboard",
  jamaah_umroh: "/jamaah/dashboard",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin_cabang: "Admin Cabang",
  mitra_agen: "Mitra Agen",
  jamaah_umroh: "Jamaah Umroh",
  muthawif: "Muthawif / Guide",
};

export const ROLE_AVATAR_INITIALS: Record<UserRole, string> = {
  super_admin: "SA",
  admin_cabang: "AC",
  mitra_agen: "MA",
  jamaah_umroh: "JM",
  muthawif: "MT",
};

export function normalizeRole(role?: string | null): UserRole | null {
  if (!role) return null;
  return ROLE_ALIASES[role.toLowerCase().trim()] ?? null;
}

export function initialsOf(name?: string | null, fallback = "U"): string {
  const clean = (name || "").trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase() || fallback;
}

export function isStaffRole(role: UserRole): boolean {
  return role === "super_admin" || role === "admin_cabang";
}
