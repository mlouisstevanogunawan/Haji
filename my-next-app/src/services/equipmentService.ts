import { dbRead, dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
import { Database } from "@/types/supabase.types";

export type EquipmentRow = Database["public"]["Tables"]["equipment"]["Row"];
export type EquipmentInsert = Database["public"]["Tables"]["equipment"]["Insert"];
export type EquipmentUpdate = Database["public"]["Tables"]["equipment"]["Update"];
export type EquipmentCondition = Database["public"]["Enums"]["equipment_condition"];

export type EquipmentAssignmentRow =
  Database["public"]["Tables"]["equipment_assignments"]["Row"];
export type EquipmentAssignmentInsert =
  Database["public"]["Tables"]["equipment_assignments"]["Insert"];
export type EquipmentAssignmentUpdate =
  Database["public"]["Tables"]["equipment_assignments"]["Update"];

export async function getEquipment(): Promise<EquipmentRow[]> {
  // Policy SELECT equipment mensyaratkan auth.uid() IS NOT NULL, jadi baca lewat
  // proxy service-role yang sudah mengenal sesi login.
  return dbRead<EquipmentRow>("equipment", {
    select: "*",
    order: "created_at",
    desc: true,
  });
}

export async function getEquipmentById(id: string): Promise<EquipmentRow | null> {
  try {
    const rows = await dbRead<EquipmentRow>("equipment", { select: "*", eq: { id } });
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function createEquipment(payload: EquipmentInsert): Promise<EquipmentRow> {
  return dbInsert<EquipmentRow>("equipment", { ...payload });
}

export async function updateEquipment(id: string, payload: EquipmentUpdate): Promise<EquipmentRow> {
  return dbUpdate<EquipmentRow>("equipment", id, { ...payload });
}

export async function deleteEquipment(id: string): Promise<boolean> {
  return dbDelete("equipment", id);
}

// ---------------------------------------------------------------------------
// equipment_assignments — penyerahan perlengkapan PER jamaah.
//
// Tabel `equipment` di atas adalah KATALOG item (name/category/quantity/
// condition) dan bukan milik jamaah tertentu. Pencatatan penyerahan barang ke
// jamaah ditulis ke `equipment_assignments` memakai kolom bertipe asli, bukan
// dengan menumpang nama jamaah ke kolom katalog.
// ---------------------------------------------------------------------------

export async function getEquipmentAssignments(): Promise<EquipmentAssignmentRow[]> {
  return dbRead<EquipmentAssignmentRow>("equipment_assignments", {
    select: "*",
    order: "created_at",
    desc: true,
  });
}

// Cari baris katalog `equipment` yang namanya sama persis dengan item yang
// dipilih. Jika ketemu, assignment menyimpan equipment_id sebagai FK; jika
// tidak (item teks bebas), cukup item_name. Katalog itu sendiri TIDAK diubah.
async function findCatalogIdByName(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  try {
    const rows = await dbRead<EquipmentRow>("equipment", {
      select: "id, name",
      eq: { name: trimmed },
      limit: 1,
    });
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function createEquipmentAssignment(
  payload: EquipmentAssignmentInsert
): Promise<EquipmentAssignmentRow> {
  const row: Record<string, unknown> = { ...payload };
  if (row.equipment_id == null && typeof row.item_name === "string") {
    const catalogId = await findCatalogIdByName(row.item_name);
    if (catalogId) row.equipment_id = catalogId;
  }
  return dbInsert<EquipmentAssignmentRow>("equipment_assignments", row);
}

export async function updateEquipmentAssignment(
  id: string,
  payload: EquipmentAssignmentUpdate
): Promise<EquipmentAssignmentRow> {
  return dbUpdate<EquipmentAssignmentRow>("equipment_assignments", id, { ...payload });
}

export async function deleteEquipmentAssignment(id: string): Promise<boolean> {
  return dbDelete("equipment_assignments", id);
}
