"use client";

import * as React from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useDocuments,
  useUpdateDocumentStatus,
  useDeleteDocument,
} from "../hooks/useDocuments";
import { DocumentWithProfile, DocumentStatus } from "../services/documentService";
import { formatDateShort } from "@/lib/utils";

interface SingleDocumentCardProps {
  doc: DocumentWithProfile;
}

export const DocumentCard: React.FC<SingleDocumentCardProps> = ({ doc }) => {
  const updateStatusMutation = useUpdateDocumentStatus();
  const deleteMutation = useDeleteDocument();

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: doc.id,
        status: newStatus,
      });
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.document_type.toUpperCase()}" untuk ${doc.profiles?.full_name || "jamaah ini"}?`)) {
      try {
        await deleteMutation.mutateAsync(doc.id);
      } catch (err: any) {
        alert(`Gagal menghapus dokumen: ${err.message}`);
      }
    }
  };

  const statusStyles: Record<DocumentStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    approved: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      label: "Disetujui",
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
      text: "text-emerald-800",
    },
    pending: {
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      label: "Menunggu Review",
      icon: <Clock className="h-3.5 w-3.5 text-amber-600" />,
      text: "text-amber-800",
    },
    rejected: {
      bg: "bg-red-50 border-red-200 text-red-800",
      label: "Ditolak",
      icon: <XCircle className="h-3.5 w-3.5 text-red-600" />,
      text: "text-red-800",
    },
  };

  const typeLabels: Record<string, string> = {
    passport: "Paspor Asli",
    visa: "Visa Umroh / Haji",
    vaccine_certificate: "Sertifikat Vaksin",
    other: "Dokumen Pendukung",
  };

  const currentStatus = statusStyles[doc.status] || statusStyles.pending;
  const isUpdating = updateStatusMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/90 transition-all hover:shadow-md space-y-4">
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-200/60 uppercase">
          {typeLabels[doc.document_type] || doc.document_type}
        </span>

        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${currentStatus.bg}`}
        >
          {currentStatus.icon}
          <span>{currentStatus.label}</span>
        </span>
      </div>

      {/* Profile & Document Detail */}
      <div>
        <h4 className="text-base font-extrabold text-slate-900 leading-snug">
          {doc.profiles?.full_name || "Jamaah Terdaftar"}
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          {doc.profiles?.email || "Email belum terdata"}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Nomor Dokumen
            </span>
            <span className="font-mono font-bold text-slate-800">
              {doc.document_number || "-"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Masa Berlaku
            </span>
            <span className="text-slate-700 font-medium">
              {doc.expiry_date ? formatDateShort(doc.expiry_date) : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: View File, Approve, Reject, Delete */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {doc.file_url ? (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 font-medium transition"
            >
              <ExternalLink className="h-3 w-3 text-slate-500" />
              <span>Lihat Berkas</span>
            </a>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              Berkas belum diunggah
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {doc.status !== "approved" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange("approved")}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Setujui
            </button>
          )}

          {doc.status !== "rejected" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange("rejected")}
              className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Tolak
            </button>
          )}

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            title="Hapus dokumen"
            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const TaskCard = DocumentCard;

/**
 * DocumentCardList Container:
 * Mengambil data dokumen via useDocuments() dan menangani:
 * - Skeleton loading jika isLoading
 * - Pesan error jika isError
 * - Empty State jika data kosong
 */
export const DocumentCardList: React.FC<{
  searchQuery?: string;
  statusFilter?: string;
  typeFilter?: string;
}> = ({ searchQuery = "", statusFilter = "ALL", typeFilter = "ALL" }) => {
  const { data: documents, isLoading, isError, error, refetch } = useDocuments();

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/90 space-y-4 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-slate-200 rounded-md" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
            <div className="h-14 bg-slate-100 rounded-xl" />
            <div className="h-8 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <h4 className="font-bold text-sm text-rose-900">
          Gagal Memuat Dokumen Supabase
        </h4>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          {error?.message || "Terjadi kesalahan saat mengambil data dokumen dari database."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  // Filter logic
  const filtered = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (doc.profiles?.full_name || "").toLowerCase().includes(q);
    const emailMatch = (doc.profiles?.email || "").toLowerCase().includes(q);
    const numMatch = (doc.document_number || "").toLowerCase().includes(q);
    const matchSearch = !q || nameMatch || emailMatch || numMatch;

    const matchStatus = statusFilter === "ALL" || doc.status === statusFilter;
    const matchType = typeFilter === "ALL" || doc.document_type === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  // Empty State
  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[280px]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-3">
          <FileText className="h-7 w-7" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">
          Belum ada data dokumen
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          {documents.length === 0
            ? "Belum ada dokumen paspor atau visa yang tercatat di database Supabase."
            : "Tidak ada dokumen yang sesuai dengan kriteria filter saat ini."}
        </p>
      </div>
    );
  }

  // Render Grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
};

export const TaskCardList = DocumentCardList;

