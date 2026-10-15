"use client";

import * as React from "react";
import {
  FileCheck,
  ShieldCheck,
  Clock,
  AlertCircle,
  Search,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Info,
} from "lucide-react";
import { DocumentCardList } from "@/features/documents/components/DocumentCard";
import { DocumentModal } from "@/features/documents/components/DocumentModal";
import { useDocuments } from "@/features/documents/hooks/useDocuments";

export default function DokumenPasporPage() {
  const { data: documents = [] } = useDocuments();
  const [activeFilter, setActiveFilter] = React.useState<string>("Semua");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState<boolean>(false);
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");

  // KPI Computations directly from real Supabase documents
  const totalDokumen = documents.length;
  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const rejectedCount = documents.filter((d) => d.status === "rejected").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Dokumen &amp; Paspor Jamaah
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              Database Supabase Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verifikasi kelengkapan berkas dokumen, paspor, dan visa jamaah yang tercatat di Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "cards"
                  ? "bg-emerald-50 text-emerald-800 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Berkas Supabase</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-emerald-50 text-emerald-800 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Matriks Jamaah</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Unggah Dokumen</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dokumen */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL DOKUMEN
            </p>
            <p className="text-xl font-bold text-slate-900">{totalDokumen}</p>
            <p className="text-[11px] text-slate-400">Tercatat di Supabase</p>
          </div>
        </div>

        {/* Disetujui */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DISETUJUI / VALID
            </p>
            <p className="text-xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-[11px] text-slate-400">Berkas telah diverifikasi</p>
          </div>
        </div>

        {/* Menunggu Review */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              MENUNGGU REVIEW
            </p>
            <p className="text-xl font-bold text-sky-600">{pendingCount}</p>
            <p className="text-[11px] text-slate-400">Perlu peninjauan staf</p>
          </div>
        </div>

        {/* Perlu Revisi / Ditolak */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PERLU REVISI
            </p>
            <p className="text-xl font-bold text-rose-500">{rejectedCount}</p>
            <p className="text-[11px] text-slate-400">Berkas ditolak</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedSearch(searchQuery);
              }}
              placeholder="Cari nama jamaah, email, atau nomor dokumen..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setAppliedSearch(searchQuery)}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-xs font-semibold transition cursor-pointer"
          >
            Cari
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveFilter("Semua")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeFilter === "Semua"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Dokumen ({totalDokumen})
          </button>
          <button
            onClick={() => setActiveFilter("Disetujui")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeFilter === "Disetujui"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Disetujui ({approvedCount})
          </button>
          <button
            onClick={() => setActiveFilter("Menunggu")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeFilter === "Menunggu"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Menunggu Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter("Ditolak")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeFilter === "Ditolak"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Perlu Revisi ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Konten Utama Berdasarkan View Mode */}
      {viewMode === "cards" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>
              Menampilkan data dokumen langsung dari database Supabase (Tabel <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">documents</code>).
            </p>
          </div>
          <DocumentCardList
            searchQuery={appliedSearch}
            statusFilter={
              activeFilter === "Menunggu"
                ? "pending"
                : activeFilter === "Disetujui"
                ? "approved"
                : activeFilter === "Ditolak"
                ? "rejected"
                : "ALL"
            }
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <Info className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            Fitur Matriks Jamaah Sedang Dalam Pengembangan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
            Fitur Matriks Jamaah sedang dalam pengembangan untuk integrasi Supabase penuh (join profiles, bookings, dan documents). Silakan gunakan mode <strong>Berkas Supabase</strong> (Cards) untuk saat ini.
          </p>
          <button
            onClick={() => setViewMode("cards")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Gunakan Mode Berkas Supabase</span>
          </button>
        </div>
      )}

      {/* Modal Tambah Dokumen Supabase */}
      <DocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
