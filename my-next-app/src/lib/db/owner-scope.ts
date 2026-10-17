import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pembatasan data untuk sesi non-staf.
 *
 * /api/db membaca dan menulis memakai service-role (bypass RLS) supaya form bisa
 * menyimpan. Tanpa aturan ini, akun jamaah bisa meminta baris milik orang lain.
 * Jadi untuk peran jamaah, setiap tabel pribadi dipaksa terfilter ke id user
 * yang sedang login — persis seperti policy RLS `auth.uid()`.
 */

/** Kolom pemilik per tabel; nilainya harus sama dengan user id Jamaah. */
export const OWNER_COLUMN: Record<string, string> = {
  profiles: "id",
  bookings: "pilgrim_id",
  documents: "pilgrim_id",
  equipment_assignments: "pilgrim_id",
  manasik_attendance: "pilgrim_id",
  invoices: "jamaah_id",
};

/** Tabel yang tidak boleh diakses Jamaah sama sekali. */
const DENIED = new Set(["commissions", "activity_logs", "system_settings"]);

export interface ScopeFilter {
  eq: Record<string, string>;
  in: Record<string, string[]>;
}

/**
 * Filter baca untuk satu tabel atas nama jamaah tertentu.
 * Mengembalikan `null` bila tabel memang tidak boleh diakses peran jamaah.
 */
export async function jamaahReadScope(
  supabase: SupabaseClient,
  table: string,
  userId: string
): Promise<ScopeFilter | null> {
  if (DENIED.has(table)) return null;

  if (table === "payments") {
    // payments tidak punya kolom jamaah; ikat lewat invoice milik jamaah ini.
    const { data } = await supabase
      .from("invoices")
      .select("id")
      .eq("jamaah_id", userId);
    return { eq: {}, in: { invoice_id: (data ?? []).map((row: any) => row.id) } };
  }

  const column = OWNER_COLUMN[table];
  if (!column) return { eq: {}, in: {} };
  return { eq: { [column]: userId }, in: {} };
}

/** Baris/target milik jamaah ini? Tabel tanpa kolom pemilik selalu lolos. */
export function jamaahOwnsRow(
  table: string,
  row: Record<string, unknown> | null | undefined,
  userId: string
): boolean {
  const column = OWNER_COLUMN[table];
  if (!column) return true;
  return Boolean(row) && (row as Record<string, unknown>)[column] === userId;
}

/**
 * Pembatasan data untuk portal Mitra Agen dan Muthawif.
 *
 * Keduanya bukan staf penuh: mereka mengurus jamaah yang booking-nya terhubung
 * ke baris master milik akun login (agents.user_id / guides.user_id). Kolom pada
 * bookings/commissions/manasik_sessions menyimpan id baris master itu, bukan id
 * login, jadi id-nya harus dicari lebih dulu.
 */
const PORTAL_DENIED: Record<string, Set<string>> = {
  mitra_agen: new Set(["activity_logs", "system_settings", "manasik_sessions", "manasik_attendance"]),
  muthawif: new Set(["activity_logs", "system_settings", "commissions", "invoices", "payments"]),
};

export function portalDenies(table: string, role: string): boolean {
  return Boolean(PORTAL_DENIED[role]?.has(table));
}

export interface PortalScope {  /** agents.id / guides.id milik akun login. */
  masterIds: string[];
  /** bookings.agent_id / bookings.guide_id. */
  masterColumn: string;
  /** pilgrim_id dari booking yang terhubung ke masterIds. */
  pilgrimIds: string[];
}

export async function portalScopeOf(
  supabase: SupabaseClient,
  session: { id: string; role: string }
): Promise<PortalScope> {
  const isGuide = session.role === "muthawif";
  const masterTable = isGuide ? "guides" : "agents";
  const masterColumn = isGuide ? "guide_id" : "agent_id";

  const { data: masters } = await supabase
    .from(masterTable)
    .select("id")
    .eq("user_id", session.id);
  const masterIds = (masters ?? []).map((row: any) => row.id).filter(Boolean);

  let pilgrimIds: string[] = [];
  if (masterIds.length) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("pilgrim_id")
      .in(masterColumn, masterIds);
    pilgrimIds = (bookings ?? []).map((row: any) => row.pilgrim_id).filter(Boolean);
  }

  return { masterIds, masterColumn, pilgrimIds };
}

export async function portalReadScope(
  supabase: SupabaseClient,
  table: string,
  session: { id: string; role: string },
  scope: PortalScope
): Promise<ScopeFilter | null> {
  if (PORTAL_DENIED[session.role]?.has(table)) return null;

  const isGuide = session.role === "muthawif";
  const masterTable = isGuide ? "guides" : "agents";

  if (table === masterTable) return { eq: { user_id: session.id }, in: {} };

  if (table === "bookings" || table === "commissions") {
    return { eq: {}, in: { [table === "bookings" ? scope.masterColumn : "agent_id"]: scope.masterIds } };
  }

  if (table === "manasik_sessions") {
    return { eq: {}, in: { muthawif_id: scope.masterIds } };
  }

  if (table === "payments") {
    const { data } = scope.pilgrimIds.length
      ? await supabase.from("invoices").select("id").in("jamaah_id", scope.pilgrimIds)
      : { data: [] as any[] };
    return { eq: {}, in: { invoice_id: (data ?? []).map((row: any) => row.id) } };
  }

  const column = OWNER_COLUMN[table];
  if (!column) return { eq: {}, in: {} };
  // profiles: baris miliknya sendiri boleh dibaca (nama akun dipakai di header
  // portal), selain data jamaah yang dibinanya.
  const values =
    table === "profiles" && !scope.pilgrimIds.includes(session.id)
      ? [...scope.pilgrimIds, session.id]
      : scope.pilgrimIds;
  return { eq: {}, in: { [column]: values } };
}

/** Baris tabel pribadi ini termasuk jamaah yang dibina portal tersebut? */
export function portalOwnsRow(
  table: string,
  row: Record<string, unknown> | null | undefined,
  scope: PortalScope
): boolean {
  if (!row) return true;
  if (table === "bookings") return scope.masterIds.includes(String(row[scope.masterColumn] ?? ""));
  const column = OWNER_COLUMN[table];
  if (!column) return true;
  return scope.pilgrimIds.includes(String(row[column] ?? ""));
}
