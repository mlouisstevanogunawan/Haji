import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/api/session";
import {
  OWNER_COLUMN,
  jamaahOwnsRow,
  jamaahReadScope,
  portalDenies,
  portalOwnsRow,
  portalReadScope,
  portalScopeOf,
  type PortalScope,
  type ScopeFilter,
} from "@/lib/db/owner-scope";
import { isWritableTable, unknownColumns, WRITABLE_COLUMNS } from "@/lib/db/writable-schema";

/**
 * Titik tulis tunggal untuk seluruh form CRUD aplikasi.
 *
 * Kenapa perlu: beberapa tabel punya policy RLS yang menuntut auth.uid() atau
 * is_admin(), dan query dari browser dengan anon key menghasilkan 0 baris tanpa
 * error yang kelihatan. Endpoint ini memverifikasi sesi Supabase Auth pemanggil
 * (lewat requireSession), lalu membaca/menulis memakai service-role key.
 *
 * Pengaman: hanya tabel dalam WRITABLE_COLUMNS yang boleh disentuh, hanya kolom
 * terdaftar yang boleh ditulis, payload kosong ditolak, dan pemanggil wajib
 * punya token Supabase Auth yang valid.
 */

type Action = "insert" | "update" | "delete" | "upsert";

const ACTIONS: Action[] = ["insert", "update", "delete", "upsert"];

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Peran yang datanya dibatasi per orang (bukan staf yang butuh rekap semua). */
function isPersonalScope(role: string) {
  return role === "jamaah_umroh" || role === "mitra_agen" || role === "muthawif";
}

/**
 * Filter wajib untuk satu tabel atas nama sesi. `null` berarti tabelnya ditolak.
 * Portal agen/muthawif memakai `portal` yang sudah dihitung agar tidak membaca
 * tabel master dua kali.
 */
async function resolveReadScope(
  supabase: any,
  table: string,
  session: { id: string; role: string },
  portal: PortalScope
): Promise<ScopeFilter | null> {
  if (session.role === "jamaah_umroh") return jamaahReadScope(supabase, table, session.id);
  return portalReadScope(supabase, table, session, portal);
}

// Kegagalan jaringan/TLS muncul sebagai "TypeError: fetch failed" tanpa detail,
// sehingga mudah disalahartikan sebagai bug form. Terjemahkan ke penyebab aslinya.
function describeError(err: any, fallback: string): string {
  const code = err?.cause?.code || err?.code || "";
  const text = `${err?.message || ""} ${code}`;
  if (/fetch failed|Failed to fetch|ECONN|ENOTFOUND|EAI_AGAIN|CERT|TLS|network/i.test(text)) {
    return (
      `Koneksi dari server ke Supabase gagal (${code || err?.message}). ` +
      "Ini gangguan jaringan/TLS, bukan data atau validasi form. Jika mesin memakai " +
      "proxy HTTPS yang mengganti sertifikat (panel lokal/VPN/korporat), tambahkan CA " +
      "proxy tersebut ke Node lewat NODE_EXTRA_CA_CERTS lalu jalankan ulang dev server."
    );
  }
  return err?.message || fallback;
}

/**
 * Baca data memakai service-role.
 *
 * Dibutuhkan karena policy SELECT pada beberapa tabel menuntut auth.uid() atau
 * is_admin(), sehingga query browser dengan anon key bisa mengembalikan 0 baris.
 * Gantiannya bukan menghapus RLS, tapi membatasi hasil di sini: sesi jamaah
 * dipaksa terfilter ke barisnya sendiri dan sesi agen/muthawif ke jamaah yang
 * dibinanya (lihat owner-scope.ts), sedangkan sesi staf boleh membaca lintas
 * baris karena memang butuh rekap operasional.
 *
 * `select` diteruskan apa adanya (bukan divalidasi per kolom) karena service
 * memakai nested relation seperti `profiles:jamaah_id(...)` yang tidak bisa
 * diurai aman di sini. Nama tabel tetap di-allowlist.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (!session) {
      return bad("Sesi tidak valid. Silakan login terlebih dahulu.", 401);
    }

    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table") ?? "";

    if (!isWritableTable(table)) {
      return bad(`Tabel '${table}' tidak terdaftar.`, 400);
    }

    const select = searchParams.get("select") ?? "*";
    if (select.includes(";") || select.includes("/*") || select.includes("--")) {
      return bad("Ekspresi select tidak valid.", 400);
    }

    const supabase = createAdminClient();

    // Jamaah dan portal agen/muthawif hanya boleh melihat baris miliknya sendiri.
    const personal = isPersonalScope(session.role);
    let scope: ScopeFilter | null = null;
    if (personal) {
      const portal = await portalScopeOf(supabase as any, session);
      const resolved = await resolveReadScope(supabase as any, table, session, portal);
      if (resolved === null) {
        return bad(`Akun ${session.role} tidak punya hak akses ke tabel '${table}'.`, 403);
      }
      scope = resolved;
    }

    const skipped = new Set(["table", "select", "order", "desc", "limit"]);
    const filters: Array<[string, string]> = [];
    const inFilters: Array<[string, string[]]> = [];
    searchParams.forEach((value, key) => {
      if (skipped.has(key)) return;
      if (key.startsWith("in_")) {
        inFilters.push([key.slice(3), value.split(",").filter(Boolean)]);
        return;
      }
      filters.push([key, value]);
    });

    if (scope) {
      for (const [column, value] of Object.entries(scope.eq)) {
        filters.push([column, value]);
      }
      for (const [column, values] of Object.entries(scope.in)) {
        inFilters.push([column, values]);
      }
    }

    // Builder PostgREST punya tipe generik yang sangat dalam; menyambungnya di
    // luar membuat TS menyerah (TS2589), jadi rantai filter dipakai lewat any.
    let query: any = supabase.from(table).select(select);

    for (const [column, value] of filters) {
      query = query.eq(column, value);
    }
    for (const [column, values] of inFilters) {
      query = query.in(column, values);
    }

    const order = searchParams.get("order");
    if (order) {
      query = query.order(order, { ascending: searchParams.get("desc") !== "true" });
    }

    const limit = Number(searchParams.get("limit"));
    if (Number.isFinite(limit) && limit > 0) {
      query = query.limit(Math.min(limit, 2000));
    }

    const { data, error } = await query;
    if (error) return bad(describeError(error, "Gagal mengakses Supabase."), 500);
    return NextResponse.json({ data: data ?? [] });
  } catch (err: any) {
    return bad(describeError(err, "Gagal membaca data."), 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (!session) {
      return bad("Sesi tidak valid. Silakan login terlebih dahulu.", 401);
    }

    const body = await req.json();
    const { table, action, payload, id, match } = body as {
      table: string;
      action: Action;
      payload?: Record<string, unknown>;
      id?: string;
      match?: Record<string, string | number | boolean | null>;
    };

    if (!table || !isWritableTable(table)) {
      return bad(
        `Tabel '${String(table)}' tidak terdaftar sebagai tabel yang boleh ditulis. ` +
          `Tambahkan di src/lib/db/writable-schema.ts bila memang perlu.`
      );
    }

    if (!action || !ACTIONS.includes(action)) {
      return bad(`Aksi '${String(action)}' tidak dikenal. Gunakan insert/update/delete/upsert.`);
    }

    const supabase = createAdminClient();
    const isJamaah = session.role === "jamaah_umroh";
    const isPortal = session.role === "mitra_agen" || session.role === "muthawif";
    const ownerColumn = OWNER_COLUMN[table];

    let portal: PortalScope | null = null;
    if (isPortal) {
      if (portalDenies(table, session.role)) {
        return bad(`Akun ${session.role} tidak boleh mengubah tabel '${table}'.`, 403);
      }
      portal = await portalScopeOf(supabase as any, session);
    }

    // Jamaah hanya boleh menyentuh barisnya sendiri: payload harus memiliki
    // kolom pemilik berisi id login, dan baris target harus milik mereka.
    if (isJamaah && ownerColumn) {
      if (action === "insert" || action === "upsert") {
        if (!payload || payload[ownerColumn] !== session.id) {
          return bad(
            `Akun jamaah hanya bisa menyimpan data atas nama dirinya sendiri (kolom ${ownerColumn}).`,
            403
          );
        }
      } else if (id) {
        const { data: target } = await (supabase as any)
          .from(table)
          .select(ownerColumn === "id" ? "id" : ownerColumn)
          .eq("id", id)
          .maybeSingle();
        if (!jamaahOwnsRow(table, target, session.id)) {
          return bad(`Baris '${table}' ini bukan milik akun jamaah yang sedang login.`, 403);
        }
      } else if (match && Object.keys(match).length > 0) {
        if (ownerColumn in match && match[ownerColumn] !== session.id) {
          return bad(`Akun jamaah hanya bisa mengubah baris miliknya sendiri.`, 403);
        }
      }
    }

    // Portal agen/muthawif: hanya jamaah binaannya. Membuat profil jamaah baru
    // tetap boleh (itu justru alur pendaftaran), tetapi mengubah/menghapus baris
    // pribadi milik orang lain tidak.
    if (isPortal && portal) {
      // Membuat profil jamaah baru tetap boleh (itu alur pendaftaran agen /
      // muthawif); semua tulis lain harus menarget jamaah binaannya.
      const checkRow = !(action === "insert" && table === "profiles");
      if (checkRow) {
        if (action === "insert" || action === "upsert") {
          if (!payload || !portalOwnsRow(table, payload, portal)) {
            return bad(
              `Akun ${session.role} hanya bisa menyimpan data untuk jamaah yang terdaftar padanya.`,
              403
            );
          }
        } else if (id) {
          const selectColumns =
            table === "bookings" ? portal.masterColumn : ownerColumn || portal.masterColumn;
          const { data: target } = await (supabase as any)
            .from(table)
            .select(selectColumns)
            .eq("id", id)
            .maybeSingle();
          if (!portalOwnsRow(table, target, portal)) {
            return bad(`Baris '${table}' ini bukan data jamaah binaan akun yang sedang login.`, 403);
          }
        }
      }
    }

    if (action === "delete") {
      if (!id) return bad("Delete membutuhkan `id` baris yang akan dihapus.");
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .select("id");
      if (error) return bad(describeError(error, "Gagal mengakses Supabase."), 500);
      return NextResponse.json({ data, deleted: (data?.length ?? 0) > 0 });
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return bad("Field `payload` wajib diisi object data yang akan disimpan.");
    }

    const keys = Object.keys(payload);
    if (keys.length === 0) {
      return bad(
        `Payload kosong: tidak ada kolom yang dikirim untuk ${table}. ` +
          `Ini biasanya tanda form hanya mengubah state React tanpa menyiapkan data.`
      );
    }

    const offending = unknownColumns(table, payload);
    if (offending.length > 0) {
      return bad(
        `Kolom berikut tidak ada di tabel '${table}': ${offending.join(", ")}. ` +
          `Kolom yang tersedia: ${WRITABLE_COLUMNS[table].join(", ")}.`
      );
    }

    if (action === "insert") {
      const { data, error } = await supabase
        .from(table)
        .insert([payload])
        .select()
        .single();
      if (error) return bad(describeError(error, "Gagal mengakses Supabase."), 500);
      return NextResponse.json({ data });
    }

    if (action === "upsert") {
      const { data, error } = await supabase
        .from(table)
        .upsert([payload], match ? { onConflict: Object.keys(match).join(",") } : undefined)
        .select()
        .single();
      if (error) return bad(describeError(error, "Gagal mengakses Supabase."), 500);
      return NextResponse.json({ data });
    }

    // action === "update"
    let query = supabase.from(table).update(payload);
    if (id) {
      query = query.eq("id", id);
    } else if (match && Object.keys(match).length > 0) {
      for (const [column, value] of Object.entries(match)) {
        if (!WRITABLE_COLUMNS[table].includes(column)) {
          return bad(`Kolom filter '${column}' tidak ada di tabel '${table}'.`);
        }
        query = query.eq(column, value);
      }
      if (isJamaah && ownerColumn && !(ownerColumn in match)) {
        query = query.eq(ownerColumn, session.id);
      } else if (isPortal && portal) {
        const column = table === "bookings" ? portal.masterColumn : ownerColumn;
        const values = table === "bookings" ? portal.masterIds : portal.pilgrimIds;
        if (column && !(column in match)) {
          query = query.in(column, values);
        }
      }
    } else {
      return bad("Update membutuhkan `id` baris atau object `match` sebagai filter.");
    }

    const { data, error } = await query.select().maybeSingle();
    if (error) return bad(describeError(error, "Gagal mengakses Supabase."), 500);
    if (!data) {
      return bad(
        `Update ${table} tidak mengenai baris apa pun (id/match tidak ditemukan).`,
        404
      );
    }
    return NextResponse.json({ data });
  } catch (err: any) {
    return bad(describeError(err, "Gagal memproses permintaan database."), 500);
  }
}
