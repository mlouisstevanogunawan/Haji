import type { WritableTable } from "@/lib/db/writable-schema";

/**
 * Client-side pembantu tulis.
 *
 * Semua fungsi tulis di src/services dan folder services di src/features dipanggil dari
 * browser memakai anon key, sehingga diblokir RLS (lihat penjelasan di
 * src/app/api/db/route.ts). Fungsi ini mengarahkan tulisan ke endpoint /api/db
 * yang berjalan dengan service-role, jadi data benar-benar tersimpan.
 *
 * Error dari server dilempar sebagai Error biasa dengan pesan asli, sehingga
 * pola `throw new Error(error.message)` di service dan toast error di halaman
 * tetap bekerja dan kini menampilkan kegagalan yang sesungguhnya.
 */

type Action = "insert" | "update" | "delete" | "upsert";

async function request<T>(
  action: Action,
  table: WritableTable,
  body: { payload?: Record<string, unknown>; id?: string; match?: Record<string, unknown> }
): Promise<T> {
  const response = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, action, ...body }),
  });

  let parsed: { data?: T; error?: string; deleted?: boolean } = {};
  try {
    parsed = await response.json();
  } catch {
    // response tanpa body JSON (mis. 502 dari proxy)
  }

  if (!response.ok) {
    const message =
      parsed.error || `Gagal menyimpan ke tabel '${table}' (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return parsed.data as T;
}

export function dbInsert<T>(table: WritableTable, payload: Record<string, unknown>): Promise<T> {
  return request<T>("insert", table, { payload });
}

export function dbUpdate<T>(
  table: WritableTable,
  id: string,
  payload: Record<string, unknown>
): Promise<T> {
  return request<T>("update", table, { id, payload });
}

export function dbUpdateMatch<T>(
  table: WritableTable,
  match: Record<string, unknown>,
  payload: Record<string, unknown>
): Promise<T> {
  return request<T>("update", table, { match, payload });
}

export function dbUpsert<T>(
  table: WritableTable,
  payload: Record<string, unknown>,
  match?: Record<string, unknown>
): Promise<T> {
  return request<T>("upsert", table, { payload, match });
}

export async function dbDelete(table: WritableTable, id: string): Promise<boolean> {
  await request<unknown>("delete", table, { id });
  return true;
}

export async function dbRead<T>(
  table: WritableTable,
  options: {
    select?: string;
    eq?: Record<string, string | number | boolean>;
    in?: Record<string, Array<string | number>>;
    order?: string;
    desc?: boolean;
    limit?: number;
  } = {}
): Promise<T[]> {
  const params = new URLSearchParams({ table });
  if (options.select) params.set("select", options.select);
  if (options.order) params.set("order", options.order);
  if (options.desc) params.set("desc", "true");
  if (options.limit) params.set("limit", String(options.limit));
  for (const [column, value] of Object.entries(options.eq ?? {})) {
    params.set(column, String(value));
  }
  for (const [column, values] of Object.entries(options.in ?? {})) {
    params.set(`in_${column}`, values.join(","));
  }

  const response = await fetch(`/api/db?${params.toString()}`);
  const parsed = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      parsed.error || `Gagal membaca tabel '${table}' (HTTP ${response.status}).`
    );
  }

  return (parsed.data ?? []) as T[];
}
