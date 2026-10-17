"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import {
  getEquipmentAssignments,
  createEquipmentAssignment,
  updateEquipmentAssignment,
  deleteEquipmentAssignment,
  EquipmentAssignmentRow,
} from "@/services/equipmentService";

interface EquipmentItem {
  id: string;
  pilgrimId: string | null;
  jamaah: string;
  item: string;
  ukuran: string | null;
  qty: number;
  isDelivered: boolean;
  status: "Sudah Diserahkan" | "Belum Diserahkan";
  diserahkan: string | null;
  notes: string | null;
}

function deliveredToStatus(isDelivered: boolean): EquipmentItem["status"] {
  return isDelivered ? "Sudah Diserahkan" : "Belum Diserahkan";
}

function formatTanggal(value: string | null | undefined): string {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PerlengkapanPage() {
  const [items, setItems] = React.useState<EquipmentItem[]>([]);
  const [, setIsLoading] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<EquipmentItem | null>(null);

  // Form states
  const [formJamaah, setFormJamaah] = React.useState("");
  const [formItem, setFormItem] = React.useState("Koper");
  const [formQty, setFormQty] = React.useState(1);
  const [formStatus, setFormStatus] = React.useState<"Sudah Diserahkan" | "Belum Diserahkan">(
    "Belum Diserahkan"
  );

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getEquipmentAssignments();
      const mapped: EquipmentItem[] = (records || []).map((r: EquipmentAssignmentRow) => ({
        id: r.id,
        pilgrimId: r.pilgrim_id ?? null,
        jamaah: r.pilgrim_name ?? "",
        item: r.item_name,
        ukuran: r.size ?? null,
        qty: r.quantity ?? 0,
        isDelivered: r.is_delivered,
        status: deliveredToStatus(r.is_delivered),
        diserahkan: r.delivered_at ?? null,
        notes: r.notes ?? null,
      }));
      setItems(mapped);
    } catch (err: unknown) {
      console.error("Gagal memuat data perlengkapan:", err);
      setItems([]);
      showToast(`Gagal memuat data perlengkapan: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const totalResults = items.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJamaah.trim() || !formItem.trim()) return;

    try {
      await createEquipmentAssignment({
        pilgrim_name: formJamaah.trim(),
        item_name: formItem.trim(),
        quantity: formQty,
        condition: "good",
        size: null,
        is_delivered: formStatus === "Sudah Diserahkan",
        delivered_at: null,
        notes: null,
      });
      setIsAddModalOpen(false);
      setFormJamaah("");
      await loadData();
      showToast("Perlengkapan berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal menambah perlengkapan:", err);
      showToast(`Gagal menyimpan perlengkapan: ${(err as Error).message}`);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      await updateEquipmentAssignment(editItem.id, {
        pilgrim_name: editItem.jamaah.trim() || null,
        item_name: editItem.item,
        quantity: editItem.qty,
        size: editItem.ukuran?.trim() || null,
        is_delivered: editItem.status === "Sudah Diserahkan",
        notes: editItem.notes?.trim() || null,
      });
      setEditItem(null);
      await loadData();
      showToast("Perubahan perlengkapan berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal memperbarui perlengkapan:", err);
      showToast(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus catatan perlengkapan ini?")) {
      try {
        await deleteEquipmentAssignment(id);
        await loadData();
        showToast("Perlengkapan berhasil dihapus dari Supabase.");
      } catch (err: unknown) {
        console.error("Gagal menghapus perlengkapan:", err);
        showToast(`Gagal menghapus perlengkapan: ${(err as Error).message}`);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Beranda</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Perlengkapan</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Perlengkapan</h1>
          <p className="text-sm text-gray-500">Distribusi perlengkapan jamaah</p>
        </div>

        {/* Primary Button */}
        <div>
          <Link
            href="/perlengkapan/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Perlengkapan</span>
          </Link>
        </div>
      </div>

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
                  ITEM
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  UKURAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  QTY
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DISERAHKAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {totalResults === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                    Belum ada data perlengkapan tersimpan di Supabase.
                  </td>
                </tr>
              )}
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Jamaah */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.jamaah}
                  </td>

                  {/* Item */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.item}
                  </td>

                  {/* Ukuran */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.ukuran || "-"}
                  </td>

                  {/* Qty */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.qty}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.status === "Sudah Diserahkan" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Sudah Diserahkan
                      </span>
                    )}
                    {item.status === "Belum Diserahkan" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Belum Diserahkan
                      </span>
                    )}
                  </td>

                  {/* Diserahkan */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTanggal(item.diserahkan)}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => setEditItem(item)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-100 gap-3 text-xs text-gray-500">
          <span>
            Showing {Math.min(startIndex + 1, totalResults)} to{" "}
            {Math.min(startIndex + itemsPerPage, totalResults)} of {totalResults} results
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={activePage === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`min-w-[28px] h-7 px-2 rounded-lg font-medium transition ${
                  activePage === num
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={activePage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah Perlengkapan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tambah Perlengkapan</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Nama Jamaah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Indra Kusuma"
                  value={formJamaah}
                  onChange={(e) => setFormJamaah(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Item Perlengkapan</label>
                <select
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Koper">Koper</option>
                  <option value="Seragam">Seragam</option>
                  <option value="Kain Ihram">Kain Ihram</option>
                  <option value="Mukena">Mukena</option>
                  <option value="Tas Paspor">Tas Paspor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value) || 1)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Status Distribusi</label>
                <select
                  value={formStatus}
                  onChange={(e) =>
                    setFormStatus(e.target.value as "Sudah Diserahkan" | "Belum Diserahkan")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Belum Diserahkan">Belum Diserahkan</option>
                  <option value="Sudah Diserahkan">Sudah Diserahkan</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Perlengkapan */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Perlengkapan</h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nama Jamaah</label>
                <input
                  type="text"
                  value={editItem.jamaah}
                  onChange={(e) => setEditItem({ ...editItem, jamaah: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Item</label>
                <input
                  type="text"
                  value={editItem.item}
                  onChange={(e) => setEditItem({ ...editItem, item: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={editItem.qty}
                    onChange={(e) =>
                      setEditItem({ ...editItem, qty: Number(e.target.value) || 1 })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editItem.status}
                  onChange={(e) => {
                    const st = e.target.value as "Sudah Diserahkan" | "Belum Diserahkan";
                    setEditItem({ ...editItem, status: st, isDelivered: st === "Sudah Diserahkan" });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Belum Diserahkan">Belum Diserahkan</option>
                  <option value="Sudah Diserahkan">Sudah Diserahkan</option>
                </select>
              </div>

              <p className="text-xs text-gray-400">
                Status &quot;Sudah Diserahkan&quot; menyimpan flag pengiriman dan tanggal
                penyerahan pada record perlengkapan jamaah.
              </p>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
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
