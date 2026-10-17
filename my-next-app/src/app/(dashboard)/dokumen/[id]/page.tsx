"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";
import { useRole } from "@/context/RoleContext";
import {
  getDocuments,
  createDocument,
  updateDocumentStatus,
  deleteDocument,
  type DocumentWithProfile,
} from "@/features/documents/services/documentService";

interface DocumentItemState {
  id: string;
  name: string;
  status: "Terverifikasi" | "Sudah Diunggah" | "Belum Diunggah";
  verifiedDate?: string;
  file?: File | null;
  fileName?: string;
}

// Template checklist standar: enum `document_type` di Supabase hanya punya
// passport / visa / vaccine_certificate / other, jadi dokumen identitas
// lain disimpan sebagai "other" dengan label pada document_status_note.
const STANDARD_CHECKLIST: { type: "passport" | "visa" | "vaccine_certificate" | "other"; label: string }[] = [
  { type: "other", label: "KTP" },
  { type: "other", label: "Kartu Keluarga" },
  { type: "passport", label: "Paspor" },
  { type: "other", label: "Pas Foto 4x6 (latar putih)" },
  { type: "other", label: "Buku Nikah / Akta Lahir" },
  { type: "vaccine_certificate", label: "Sertifikat Vaksin Meningitis" },
];

const TYPE_LABELS: Record<string, string> = {
  passport: "Paspor",
  visa: "Visa",
  vaccine_certificate: "Sertifikat Vaksin",
  other: "Dokumen Lainnya",
};

function displayName(doc: DocumentWithProfile): string {
  if (doc.document_type === "other") {
    return doc.document_status_note || TYPE_LABELS.other;
  }
  return doc.document_status_note || TYPE_LABELS[doc.document_type] || doc.document_type;
}

function mapDocument(doc: DocumentWithProfile): DocumentItemState {
  const status: DocumentItemState["status"] =
    doc.status === "approved"
      ? "Terverifikasi"
      : doc.file_url
      ? "Sudah Diunggah"
      : "Belum Diunggah";

  let verifiedDate: string | undefined;
  if (doc.status === "approved" && doc.updated_at) {
    const parsed = new Date(doc.updated_at);
    verifiedDate = Number.isNaN(parsed.getTime())
      ? doc.updated_at
      : parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }

  return {
    id: doc.id,
    name: displayName(doc),
    status,
    verifiedDate,
    fileName: doc.file_url || undefined,
  };
}

export default function DokumenJamaahDetailPage() {
  const params = useParams();
  const routeId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  // Jamaah selalu dibaca dari id sesi login-nya sendiri; halaman ini juga dipakai
  // rute tanpa parameter (/dokumen dan /jamaah/dokumen) yang dulu selalu kosong.
  const { role, userId } = useRole();
  const id = role === "jamaah_umroh" ? userId : routeId;

  const [jamaahName, setJamaahName] = React.useState("-");
  const [code, setCode] = React.useState("-");
  const [documents, setDocuments] = React.useState<DocumentItemState[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [fileInputs, setFileInputs] = React.useState<Record<string, File | null>>({});
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    if (!id) {
      setNotFound(true);
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      const [list, allDocs] = await Promise.all([getJamaahList(), getDocuments()]);
      const found: JamaahProfile | undefined = (list || []).find((item) => item.id === id);

      if (!found) {
        setNotFound(true);
        setDocuments([]);
        setJamaahName("-");
        setCode("-");
        return;
      }

      setNotFound(false);
      setJamaahName(found.name);
      setCode(found.code || "-");

      const docs = (allDocs || []).filter((d) => d.pilgrim_id === found.id);
      setDocuments(docs.map(mapDocument));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memuat dokumen jamaah dari Supabase:", err);
      setDocuments([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileInputs((prev) => ({ ...prev, [docId]: file }));
  };

  const handleUpload = async (docId: string) => {
    const selectedFile = fileInputs[docId];
    if (!selectedFile) {
      alert("Silakan pilih berkas terlebih dahulu untuk diunggah!");
      return;
    }

    setIsSaving(true);
    try {
      // Belum ada endpoint Supabase Storage, jadi yang dicatat ke `documents`
      // adalah nama berkasnya (kolom file_url) + status "pending".
      await updateDocumentStatus(docId, "pending", selectedFile.name);
      setFileInputs((prev) => ({ ...prev, [docId]: null }));
      await loadData();
      alert(`Berkas ${selectedFile.name} berhasil dicatat ke Supabase!`);
    } catch (err: unknown) {
      console.error("Gagal menyimpan dokumen:", err);
      alert(`Gagal menyimpan dokumen: ${(err as Error).message}`);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId]!.value = "";
    }
    setFileInputs((prev) => ({ ...prev, [docId]: null }));

    try {
      await deleteDocument(docId);
      await loadData();
    } catch (err: unknown) {
      console.error("Gagal menghapus dokumen:", err);
      alert(`Gagal menghapus dokumen: ${(err as Error).message}`);
      await loadData();
    }
  };

  const handleCreateStandardChecklist = async () => {
    if (!id) {
      alert("Jamaah tidak ditemukan, checklist tidak dapat dibuat.");
      return;
    }

    setIsSaving(true);
    try {
      const existing = await getDocuments();
      const mine = (existing || []).filter((d) => d.pilgrim_id === id);

      // Satu checklist hanya boleh punya satu baris per label
      for (const item of STANDARD_CHECKLIST) {
        const already = mine.some(
          (d) =>
            d.document_type === item.type &&
            (item.type === "other" ? (d.document_status_note || "") === item.label : true)
        );
        if (already) continue;

        await createDocument({
          pilgrim_id: id,
          pilgrim_name: jamaahName,
          document_type: item.type,
          document_status_note: item.type === "other" ? item.label : null,
          status: "pending",
        });
      }

      await loadData();
      alert("Checklist standar berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal membuat checklist dokumen:", err);
      alert(`Gagal membuat checklist dokumen: ${(err as Error).message}`);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoading && notFound) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Data tidak ditemukan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Jamaah dengan id <span className="font-mono">{id || "(kosong)"}</span> tidak ada di
            Supabase.
            {loadError ? ` Pesan error: ${loadError}` : ""}
          </p>
          <Link
            href="/dokumen"
            className="inline-block mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            Kembali ke Dokumen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section with Breadcrumb & Checklist Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <Link href="/dokumen" className="hover:text-gray-900 transition">
              Dokumen
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">{jamaahName}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            Dokumen — {jamaahName}
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Kode: {code}</p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleCreateStandardChecklist}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-2 text-xs font-medium shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5 text-gray-600" />
            <span>{isSaving ? "Menyimpan..." : "Buat Checklist Standar"}</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DOKUMEN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  BERKAS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-gray-400">
                    Memuat dokumen dari Supabase...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-gray-400">
                    {loadError
                      ? `Gagal memuat dokumen dari Supabase: ${loadError}`
                      : "Belum ada dokumen tersimpan di Supabase. Tekan “Buat Checklist Standar” untuk menambahkannya."}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 transition border-b border-gray-100 text-xs"
                >
                  {/* Dokumen Name */}
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {doc.name}
                  </td>

                  {/* Status Badge & Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {doc.status === "Terverifikasi" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Terverifikasi
                        </span>
                      )}
                      {doc.status === "Sudah Diunggah" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Sudah Diunggah
                        </span>
                      )}
                      {doc.status === "Belum Diunggah" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Belum Diunggah
                        </span>
                      )}
                      {doc.verifiedDate && (
                        <span className="block text-[11px] text-gray-400 mt-0.5">
                          {doc.verifiedDate}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Berkas Name and File Input */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 min-w-[90px]">
                        {doc.fileName ? (
                          <span className="text-gray-900 font-medium">{doc.fileName}</span>
                        ) : (
                          "Belum diunggah"
                        )}
                      </span>
                      <input
                        type="file"
                        ref={(el) => {
                          fileInputRefs.current[doc.id] = el;
                        }}
                        onChange={(e) => handleFileChange(doc.id, e)}
                        className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                      />
                    </div>
                  </td>

                  {/* Aksi (Unggah button only) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => handleUpload(doc.id)}
                      disabled={isSaving}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      Unggah
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
