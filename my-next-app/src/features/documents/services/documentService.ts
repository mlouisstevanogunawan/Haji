import { createClient } from "@/lib/supabase/client";
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

/**
 * 1. getDocuments
 * Mengambil seluruh dokumen dengan join ke tabel profiles (nama & email jamaah),
 * diurutkan berdasarkan created_at DESC.
 */
export async function getDocuments(): Promise<DocumentWithProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, profiles(full_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as DocumentWithProfile[]) || [];
}

/**
 * 2. getDocumentById
 * Mengambil satu dokumen spesifik beserta data profil jamaah terkait.
 */
export async function getDocumentById(id: string): Promise<DocumentWithProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, profiles(full_name, email, avatar_url)")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as DocumentWithProfile;
}

/**
 * 3. createDocument
 * Menambahkan data dokumen baru ke Supabase dan me-return record yang baru dibuat.
 */
export async function createDocument(payload: DocumentInsert): Promise<DocumentRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
  const supabase = createClient();
  const updatePayload: DocumentUpdate = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (file_url !== undefined) {
    updatePayload.file_url = file_url;
  }

  const { data, error } = await supabase
    .from("documents")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 5. deleteDocument
 * Menghapus dokumen dari database berdasarkan ID.
 */
export async function deleteDocument(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
