import { dbRead, dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
import { Database } from "@/types/supabase.types";

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type DocumentStatus = Database["public"]["Enums"]["document_status"];
export type DocumentType = Database["public"]["Enums"]["document_type"];

export type DocumentWithProfile = DocumentRow & {
  profiles: Pick<ProfileRow, "full_name" | "email" | "avatar_url"> | null;
};

const DOCUMENT_SELECT = "*, profiles(full_name, email, avatar_url)";

/**
 * 1. getDocuments
 * Mengambil seluruh dokumen dengan join ke tabel profiles (nama & email jamaah),
 * diurutkan berdasarkan created_at DESC.
 */
export async function getDocuments(): Promise<DocumentWithProfile[]> {
  const data = await dbRead<DocumentWithProfile>("documents", {
    select: DOCUMENT_SELECT,
    order: "created_at",
    desc: true,
  });

  return data || [];
}

/**
 * 2. getDocumentById
 * Mengambil satu dokumen spesifik beserta data profil jamaah terkait.
 */
export async function getDocumentById(id: string): Promise<DocumentWithProfile> {
  const data = await dbRead<DocumentWithProfile>("documents", {
    select: DOCUMENT_SELECT,
    eq: { id },
    limit: 1,
  });

  if (!data[0]) {
    throw new Error("Dokumen tidak ditemukan");
  }

  return data[0];
}

/**
 * 3. createDocument
 * Menambahkan data dokumen baru ke Supabase dan me-return record yang baru dibuat.
 */
export async function createDocument(payload: DocumentInsert): Promise<DocumentRow> {
  return dbInsert<DocumentRow>("documents", { ...payload });
}

/**
 * 4. updateDocumentStatus
 * Memperbarui status verifikasi dokumen ('pending' | 'approved' | 'rejected')
 * serta opsional URL berkas (file_url).
 */
export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  file_url?: string
): Promise<DocumentRow> {
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (file_url !== undefined) {
    updatePayload.file_url = file_url;
  }

  return dbUpdate<DocumentRow>("documents", id, updatePayload);
}

/**
 * 5. deleteDocument
 * Menghapus dokumen dari database berdasarkan ID.
 */
export async function deleteDocument(id: string): Promise<void> {
  await dbDelete("documents", id);
}
