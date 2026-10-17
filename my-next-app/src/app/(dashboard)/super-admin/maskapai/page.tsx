"use client";

import * as React from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  getFlights,
  updateFlight,
  deleteFlight,
} from "@/services/flightService";

export interface AirlineItem {
  id: string;
  name: string;
  code: string;
  flightNumber: string;
  transit: string;
  isActive: boolean;
}

export default function SuperAdminMaskapaiPage() {
  const [airlines, setAirlines] = React.useState<AirlineItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  // Edit Modal State
  const [editingItem, setEditingItem] = React.useState<AirlineItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCode, setEditCode] = React.useState("");
  const [editFlightNumber, setEditFlightNumber] = React.useState("");
  const [editTransit, setEditTransit] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);


  const showToast = (kind: "error" | "success", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  const loadFlights = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getFlights();
      const mapped: AirlineItem[] = (data || []).map((f) => ({
        id: f.id,
        name: f.airline_name,
        code: f.airline_code ?? "",
        flightNumber: f.flight_number ?? "",
        transit: f.route ?? "",
        isActive: f.is_active !== false,
      }));
      setAirlines(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load flights from Supabase:", err);
      setAirlines([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const handleSearch = () => {
    setAppliedSearch(searchQuery.trim().toLowerCase());
  };

  const handleOpenEdit = (item: AirlineItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCode(item.code);
    setEditFlightNumber(item.flightNumber);
    setEditTransit(item.transit);
    setEditIsActive(item.isActive);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName.trim()) {
      showToast("error", "Nama maskapai wajib diisi.");
      return;
    }
    // flights.airline_code NOT NULL + UNIQUE, jadi wajib diisi (tidak diisi otomatis).
    if (!editCode.trim()) {
      showToast("error", "Kode maskapai (IATA) wajib diisi, contoh: EK.");
      return;
    }

    setIsSaving(true);
    try {
      await updateFlight(editingItem.id, {
        airline_name: editName.trim(),
        airline_code: editCode.trim().toUpperCase(),
        flight_number: editFlightNumber.trim() || null,
        route: editTransit.trim() || null,
        is_active: editIsActive,
      });
      setEditingItem(null);
      await loadFlights();
      showToast("success", "Data maskapai berhasil diperbarui di Supabase!");
    } catch (err: unknown) {
      console.error("Gagal memperbarui maskapai:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      try {
        await deleteFlight(id);
        await loadFlights();
        showToast("success", "Maskapai berhasil dihapus dari Supabase.");
      } catch (err: unknown) {
        console.error("Gagal menghapus maskapai:", err);
        showToast("error", `Gagal menghapus maskapai: ${(err as Error).message}`);
      }
    }
  };

  // Filtered airlines
  const filteredAirlines = airlines.filter((item) => {
    const q = appliedSearch;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.flightNumber.toLowerCase().includes(q) ||
      item.transit.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-medium shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.kind === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"
          }`}
        >
          <CheckCircle2
            className={`h-4 w-4 ${toast.kind === "error" ? "text-white" : "text-emerald-400"}`}
          />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header section with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Maskapai</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Maskapai</h1>
          <p className="text-sm text-gray-500">Daftar maskapai penerbangan</p>
        </div>

        <div>
          <Link
            href="/maskapai/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Maskapai</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Cari nama maskapai..."
          className="border border-gray-300 bg-white rounded-lg px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm w-60 sm:w-72"
        />

        <button
          onClick={handleSearch}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Table Data Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NAMA
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KODE
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NO. PENERBANGAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  TRANSIT
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                    Memuat data maskapai dari Supabase...
                  </td>
                </tr>
              ) : filteredAirlines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                    {loadError
                      ? `Gagal memuat data maskapai dari Supabase: ${loadError}`
                      : "Belum ada data maskapai tersimpan di Supabase."}
                  </td>
                </tr>
              ) : (
                filteredAirlines.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition">
                    {/* Nama */}
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {item.name}
                    </td>

                    {/* Kode */}
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {item.code || <span className="text-gray-400">Belum diisi</span>}
                    </td>

                    {/* Nomor Penerbangan */}
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {item.flightNumber || <span className="text-gray-400">Belum diisi</span>}
                    </td>

                    {/* Transit */}
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {item.transit || <span className="text-gray-400">Belum diisi</span>}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3 justify-end">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Maskapai */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Maskapai</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Maskapai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Kode Penerbangan (IATA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Penerbangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: EK-359"
                  value={editFlightNumber}
                  onChange={(e) => setEditFlightNumber(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Transit / Rute
                </label>
                <input
                  type="text"
                  value={editTransit}
                  onChange={(e) => setEditTransit(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label
                  htmlFor="editIsActive"
                  className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                >
                  Aktif
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
