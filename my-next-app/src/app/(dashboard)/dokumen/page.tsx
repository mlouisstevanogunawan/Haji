"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  FileCheck,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  ExternalLink,
} from "lucide-react";
import {
  getDocuments,
  updateDocumentStatus,
  type DocumentStatus,
  type DocumentWithProfile,
} from "@/features/documents/services/documentService";
import { getJamaahList } from "@/services/jamaahService";
import { useRole } from "@/context/RoleContext";
import DokumenJamaahDetailPage from "./[id]/page";

interface JamaahDocItemDoc {
  name: string;
  status: "verified" | "pending" | "missing";
  fileName?: string;
  docId?: string;
}

interface JamaahDocItem {
  id: string;
  name: string;
  branch: string;
  completedDocs: number;
  totalDocs: number;
  status: "Proses" | "Lengkap" | "Perlu Revisi";
  docs?: JamaahDocItemDoc[];
}

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Paspor Asli",
  visa: "Visa",
  vaccine_certificate: "Sertifikat Vaksin Meningitis",
  other: "Dokumen Lainnya",
};

function dbStatusToDisplay(status: DocumentStatus): JamaahDocItemDoc["status"] {
  if (status === "approved") return "verified";
  if (status === "rejected") return "missing";
  return "pending";
}

function displayStatusToDb(status: JamaahDocItemDoc["status"]): DocumentStatus {
  if (status === "verified") return "approved";
  if (status === "missing") return "rejected";
  return "pending";
}

function groupDocumentsToItems(
  rows: DocumentWithProfile[],
  branchByPilgrim: Map<string, string>
): JamaahDocItem[] {
  const byPilgrim = new Map<string, DocumentWithProfile[]>();
  for (const r of rows) {
    const arr = byPilgrim.get(r.pilgrim_id) ?? [];
    arr.push(r);
    byPilgrim.set(r.pilgrim_id, arr);
  }

  const items: JamaahDocItem[] = [];
  byPilgrim.forEach((docs, pilgrimId) => {
    const verifiedCount = docs.filter((d) => d.status === "approved").length;
    items.push({
      id: pilgrimId,
      name: docs[0]?.profiles?.full_name || docs[0]?.pilgrim_name || "-",
      branch: branchByPilgrim.get(pilgrimId) || "-",
      completedDocs: verifiedCount,
      totalDocs: docs.length,
      status: docs.length > 0 && verifiedCount === docs.length ? "Lengkap" : "Proses",
      docs: docs.map((d) => ({
        name: DOC_TYPE_LABELS[d.document_type] ?? d.document_type,
        status: dbStatusToDisplay(d.status),
        fileName: d.file_url ?? undefined,
        docId: d.id,
      })),
    });
  });
  return items;
}

export default function DokumenPage() {
  const { role } = useRole();
  const [dataList, setDataList] = React.useState<JamaahDocItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [selectedJamaah, setSelectedJamaah] = React.useState<JamaahDocItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Nama cabang diambil dari daftar jamaah (profiles.branch_id -> branches.name),
  // karena join documents -> profiles tidak menyertakan cabang.
  const loadData = React.useCallback(async (): Promise<JamaahDocItem[]> => {
    try {
      const [rows, jamaahRows] = await Promise.all([getDocuments(), getJamaahList()]);
      const branchByPilgrim = new Map<string, string>(
        (jamaahRows || []).map((j) => [j.id, j.branch || "-"])
      );
      const items = groupDocumentsToItems(rows || [], branchByPilgrim);
      setDataList(items);
      return items;
    } catch (err: unknown) {
      console.error("Gagal memuat dokumen jamaah:", err);
      setDataList([]);
      setSelectedJamaah(null);
      showToast(`Gagal memuat dokumen jamaah: ${(err as Error).message}`);
      return [];
    }
  }, [showToast]);

  // Load real documents from the documents service
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery.trim());
  };

  const filteredList = dataList.filter((item) =>
    item.name.toLowerCase().includes(appliedSearch.toLowerCase())
  );

  const handleToggleDocStatus = async (docIndex: number) => {
    if (!selectedJamaah) return;
    const currentDocs = selectedJamaah.docs || [];
    const target = currentDocs[docIndex];
    if (!target) return;

    if (!target.docId) {
      showToast("Dokumen ini belum tersimpan di Supabase, status tidak dapat diubah.");
      return;
    }

    const nextStatus: JamaahDocItemDoc["status"] =
      target.status === "verified"
        ? "pending"
        : target.status === "pending"
        ? "missing"
        : "verified";

    try {
      await updateDocumentStatus(target.docId, displayStatusToDb(nextStatus));

      // Ambil ulang dari database supaya tabel & modal menampilkan data terkini.
      const items = await loadData();
      const refreshed = items.find((item) => item.id === selectedJamaah.id) ?? null;
      setSelectedJamaah(refreshed);
      showToast("Status dokumen berhasil diperbarui di Supabase!");
    } catch (err: unknown) {
      console.error("Gagal memperbarui status dokumen:", err);
      showToast(`Gagal menyimpan status dokumen: ${(err as Error).message}`);
    }
  };

  if (role === "jamaah_umroh") {
    return <DokumenJamaahDetailPage />;
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>Beranda</span>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Dokumen</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Dokumen Jamaah</h1>
        <p className="text-sm text-gray-500">
          Kelengkapan &amp; verifikasi dokumen per jamaah
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama jamaah..."
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
        />
        <button
          type="submit"
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
        >
          Cari
        </button>
      </form>

      {/* Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  CABANG
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KELENGKAPAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    Tidak ada data dokumen jamaah dari Supabase.
                  </td>
                </tr>
              )}
              {filteredList.map((item) => {
                const percent = item.totalDocs
                  ? Math.round((item.completedDocs / item.totalDocs) * 100)
                  : 0;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition border-b border-gray-100"
                  >
                    {/* Jamaah */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                      {item.name}
                    </td>

                    {/* Cabang */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.branch}
                    </td>

                    {/* Kelengkapan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-28 sm:w-36 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-teal-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {item.completedDocs}/{item.totalDocs}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        {item.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/dokumen/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Kelola</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kelola Dokumen */}
      {selectedJamaah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Kelola Dokumen - {selectedJamaah.name}
                </h3>
                <p className="text-xs text-gray-500">{selectedJamaah.branch}</p>
              </div>
              <button
                onClick={() => setSelectedJamaah(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-3">
                <span className="text-sm font-medium text-teal-900">
                  Total Berkas Terverifikasi
                </span>
                <span className="text-sm font-bold text-teal-800">
                  {selectedJamaah.completedDocs} / {selectedJamaah.totalDocs} Dokumen
                </span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {(selectedJamaah.docs || []).map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition bg-white"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                      {doc.fileName ? (
                        <p className="text-xs text-teal-600 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          <span>{doc.fileName}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Belum ada file diunggah</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleDocStatus(idx)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                          doc.status === "verified"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : doc.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {doc.status === "verified" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Valid</span>
                          </>
                        ) : doc.status === "pending" ? (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Review</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            <span>Kosong</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {(selectedJamaah.docs || []).length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-400">
                    Belum ada dokumen tersimpan untuk jamaah ini.
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-400">
                Klik tombol status pada setiap dokumen untuk mengubah status verifikasi berkas jamaah secara langsung.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedJamaah(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[70] max-w-sm rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
