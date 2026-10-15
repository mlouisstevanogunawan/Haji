"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocuments,
  createDocument,
  updateDocumentStatus,
  deleteDocument,
  type DocumentInsert,
  type DocumentStatus,
  type DocumentWithProfile,
  type DocumentRow,
} from "../services/documentService";

/**
 * 1. useDocuments
 * Hook query untuk mengambil daftar semua dokumen dengan join ke data profil jamaah.
 * Mengembalikan: data, isLoading, isError, error, refetch.
 */
export function useDocuments() {
  const query = useQuery<DocumentWithProfile[], Error>({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 2. useCreateDocument
 * Hook mutation untuk menambahkan dokumen baru ke database.
 * Otomatis meng-invalidate cache 'documents' saat mutasi sukses.
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation<DocumentRow, Error, DocumentInsert>({
    mutationFn: (payload: DocumentInsert) => createDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export interface UpdateDocumentStatusVariables {
  id: string;
  status: DocumentStatus;
  file_url?: string;
}

/**
 * 3. useUpdateDocumentStatus
 * Hook mutation untuk memperbarui status verifikasi dokumen (dan opsional file URL).
 * Otomatis meng-invalidate cache 'documents' saat mutasi sukses.
 */
export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation<DocumentRow, Error, UpdateDocumentStatusVariables>({
    mutationFn: ({ id, status, file_url }: UpdateDocumentStatusVariables) =>
      updateDocumentStatus(id, status, file_url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

/**
 * 4. useDeleteDocument
 * Hook mutation untuk menghapus record dokumen berdasarkan ID.
 * Otomatis meng-invalidate cache 'documents' saat mutasi sukses.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
