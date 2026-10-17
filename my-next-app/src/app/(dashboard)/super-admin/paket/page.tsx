"use client";

import * as React from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  PackageType,
} from "@/services/packageService";

export interface PackageItem {
  id: string;
  code: string;
  name: string;
  type: "Umroh" | "Haji" | "Haji Plus";
  price: string;
  rawPrice: number;
  quota: string;
  departureDate: string;
  status: "Dibuka" | "Ditutup" | "Draft";
}

export default function SuperAdminPaketPage() {
  const [packages, setPackages] = React.useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("Semua Jenis");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Detail & Edit Modals
  const [selectedDetail, setSelectedDetail] = React.useState<PackageItem | null>(null);
  const [editingItem, setEditingItem] = React.useState<PackageItem | null>(null);
  const [editPrice, setEditPrice] = React.useState("");
  const [editQuota, setEditQuota] = React.useState("");


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadPackages = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const typeParam =
        typeFilter === "Umroh"
          ? "umroh"
          : typeFilter === "Haji" || typeFilter === "Haji Plus"
          ? "haji"
          : undefined;

      const data = await getPackages(typeParam as PackageType);
      const mapped: PackageItem[] = (data || []).map((row) => {
        // Kolom `code` belum ada di tabel packages Supabase, jadi tampilkan "-"
        const p = row as typeof row & { code?: string | null };
        const nameLower = (p.name || "").toLowerCase();
        let itemType: "Umroh" | "Haji" | "Haji Plus" = "Umroh";
        if (p.type === "haji") {
          itemType = nameLower.includes("haji plus") ? "Haji Plus" : "Haji";
        }

        const parsedDate = p.departure_date ? new Date(p.departure_date) : null;
        const formattedDate =
          parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-";

        return {
          id: p.id,
          code: p.code || "-",
          name: p.name,
          type: itemType,
          price: `Rp ${Number(p.price ?? 0).toLocaleString("id-ID")}`,
          rawPrice: Number(p.price ?? 0),
          quota: p.quota != null ? String(p.quota) : "-",
          departureDate: formattedDate,
          status: p.is_active ? "Dibuka" : "Ditutup",
        };
      });
      setPackages(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load packages from Supabase:", err);
      setPackages([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  React.useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSearch = () => {
    setAppliedSearch(searchTerm.trim().toLowerCase());
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus paket "${name}"?`)) {
      try {
        await deletePackage(id);
        await loadPackages();
        showToast("Paket berhasil dihapus dari Supabase.");
      } catch (err: unknown) {
        showToast(`Gagal menghapus paket: ${(err as Error).message}`);
      }
    }
  };

  const handleOpenEdit = (item: PackageItem) => {
    setEditingItem(item);
    setEditPrice(item.price);
    setEditQuota(item.quota);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const parsedPrice = Number(editPrice.replace(/[^\d]/g, "")) || 0;
    const quotaParts = String(editQuota).split("/");
    const quotaTotalRaw = quotaParts.length > 1 ? quotaParts[1] : quotaParts[0];
    const parsedQuota = Number(quotaTotalRaw?.replace(/[^\d]/g, "")) || 0;

    try {
      await updatePackage(editingItem.id, {
        price: parsedPrice,
        quota: parsedQuota,
      });
      setEditingItem(null);
      await loadPackages();
      showToast("Perubahan paket berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      showToast(`Gagal menyimpan perubahan paket: ${(err as Error).message}`);
    }
  };

  // Filtered packages
  const filteredPackages = packages.filter((item) => {
    const q = appliedSearch;
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q);

    const matchesType =
      typeFilter === "Semua Jenis" || item.type === typeFilter;

    const matchesStatus =
      statusFilter === "Semua Status" || item.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
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
            <span className="text-gray-900 font-medium">Paket</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Paket</h1>
          <p className="text-sm text-gray-500">Daftar paket Umroh &amp; Haji</p>
        </div>

        <div>
          <Link
            href="/paket/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Paket</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Cari nama / kode..."
          className="border border-gray-300 bg-white rounded-lg px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm w-60 sm:w-72"
        />

        {/* Jenis Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 bg-white rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
        >
          <option value="Semua Jenis">Semua Jenis</option>
          <option value="Umroh">Umroh</option>
          <option value="Haji">Haji</option>
          <option value="Haji Plus">Haji Plus</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 bg-white rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
        >
          <option value="Semua Status">Semua Status</option>
          <option value="Dibuka">Dibuka</option>
          <option value="Ditutup">Ditutup</option>
        </select>

        {/* Cari Button */}
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
                  KODE / NAMA
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JENIS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  HARGA
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KUOTA
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  BERANGKAT
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
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                    Memuat data paket dari Supabase...
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                    {loadError
                      ? `Gagal memuat data paket dari Supabase: ${loadError}`
                      : "Belum ada paket tersimpan di Supabase."}
                  </td>
                </tr>
              ) : (
                filteredPackages.map((item) => {
                  let typeBadge = "bg-emerald-50 text-emerald-700";
                  if (item.type === "Haji") {
                    typeBadge = "bg-blue-50 text-blue-700";
                  } else if (item.type === "Haji Plus") {
                    typeBadge = "bg-purple-50 text-purple-700";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition">
                      {/* Kode / Nama */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.code}</div>
                      </td>

                      {/* Jenis Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadge}`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Harga */}
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {item.price}
                      </td>

                      {/* Kuota */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {item.quota}
                      </td>

                      {/* Berangkat */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {item.departureDate}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                          {item.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-3 justify-end">
                          <button
                            onClick={() => setSelectedDetail(item)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition cursor-pointer"
                          >
                            Detail
                          </button>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Paket */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Detail Paket</h3>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm text-gray-700">
              <div>
                <span className="text-gray-500 block text-xs">Nama Paket</span>
                <span className="font-semibold text-gray-900">{selectedDetail.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Kode Paket</span>
                <span className="font-mono text-gray-800">{selectedDetail.code}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block text-xs">Jenis</span>
                  <span className="font-medium text-gray-800">{selectedDetail.type}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Harga</span>
                  <span className="font-semibold text-teal-700">{selectedDetail.price}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block text-xs">Kuota</span>
                  <span className="text-gray-800">{selectedDetail.quota}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Jadwal Berangkat</span>
                  <span className="text-gray-800">{selectedDetail.departureDate}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Status</span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                  {selectedDetail.status}
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Paket */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Paket</h3>
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
                  Nama Paket
                </label>
                <input
                  type="text"
                  disabled
                  value={editingItem.name}
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Harga
                </label>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Kuota
                </label>
                <input
                  type="text"
                  value={editQuota}
                  onChange={(e) => setEditQuota(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
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
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
