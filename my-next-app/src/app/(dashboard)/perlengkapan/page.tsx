"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  ChevronDown,
  Luggage,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Calendar,
  Truck,
} from "lucide-react";

import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  EquipmentRow,
} from "@/services/equipmentService";

export interface DistributionItem {
  id: string;
  pilgrimName: string;
  bookingCode: string;
  packageName: string;
  items: string[];
  distributedDate: string;
  method: "Diambil di Kantor" | "Dikirim Ekspedisi";
  courierReceipt?: string;
  status: "Lengkap" | "Sebagian";
}

function mapEquipmentRowToDistribution(row: EquipmentRow): DistributionItem {
  let pilgrimName = "Jamaah";
  let bookingCode = "REG-" + row.id.slice(0, 6).toUpperCase();
  let packageName = "Umroh Reguler";
  let method: "Diambil di Kantor" | "Dikirim Ekspedisi" = "Diambil di Kantor";
  let courierReceipt = "";
  let items = [row.name];

  if (row.category && row.category.includes("|")) {
    const parts = row.category.split("|").map((s) => s.trim());
    if (parts[0]) pilgrimName = parts[0];
    if (parts[1]) bookingCode = parts[1];
    if (parts[2]) packageName = parts[2];
    if (parts[3] === "Dikirim Ekspedisi") method = "Dikirim Ekspedisi";
    if (parts[4]) courierReceipt = parts[4];
    if (parts[5]) items = parts[5].split(";").filter(Boolean);
  }

  let dateFormatted = row.created_at;
  try {
    dateFormatted = new Date(row.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {}

  return {
    id: row.id,
    pilgrimName,
    bookingCode,
    packageName,
    items: items.length > 0 ? items : [row.name],
    distributedDate: dateFormatted,
    method,
    courierReceipt,
    status: row.condition === "good" ? "Lengkap" : "Sebagian",
  };
}

export default function PerlengkapanJamaahPage() {
  const [distributions, setDistributions] = React.useState<DistributionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form Fields
  const [formPilgrimName, setFormPilgrimName] = React.useState("");
  const [formBookingCode, setFormBookingCode] = React.useState("REG-202611-002");
  const [formPackageName, setFormPackageName] = React.useState("Umroh Reguler Syawal 1447H");
  const [selectedItems, setSelectedItems] = React.useState<string[]>([
    "Koper Bagasi 24\"",
    "Tas Paspor / Selempang",
    "Bahan Seragam Batik",
  ]);
  const [formMethod, setFormMethod] = React.useState<"Diambil di Kantor" | "Dikirim Ekspedisi">("Diambil di Kantor");
  const [formCourierReceipt, setFormCourierReceipt] = React.useState("");
  const [formDate, setFormDate] = React.useState("10 Okt 2026");

  // Toast
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadDistributions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await getEquipment();
      setDistributions(rows.map(mapEquipmentRowToDistribution));
    } catch (err: unknown) {
      console.error("Gagal memuat perlengkapan dari Supabase:", err);
      setDistributions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDistributions();
  }, [loadDistributions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const allAvailableItems = [
    "Koper Bagasi 24\"",
    "Koper Kabin 20\"",
    "Tas Paspor / Selempang",
    "Kain Ihram & Sabuk (Pria)",
    "Mukena & Bergo (Wanita)",
    "Bahan Seragam Batik",
    "Buku Doa & ID Card",
  ];

  const handleToggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormPilgrimName("");
    setFormBookingCode("REG-202611-002");
    setFormPackageName("Umroh Reguler Syawal 1447H");
    setSelectedItems([
      "Koper Bagasi 24\"",
      "Tas Paspor / Selempang",
      "Bahan Seragam Batik",
    ]);
    setFormMethod("Diambil di Kantor");
    setFormCourierReceipt("");
    setFormDate("10 Okt 2026");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPilgrimName.trim()) return;

    try {
      const categoryPayload = `${formPilgrimName.trim()} | ${formBookingCode} | ${formPackageName} | ${formMethod} | ${formCourierReceipt.trim()} | ${selectedItems.join(";")}`;
      const conditionPayload = selectedItems.length >= 5 ? ("good" as const) : ("damaged" as const);

      if (editingId) {
        await updateEquipment(editingId, {
          name: selectedItems.join(", ") || "Perlengkapan Umroh",
          category: categoryPayload,
          quantity: selectedItems.length,
          condition: conditionPayload,
        });
        showToast("Data perlengkapan berhasil diperbarui di Supabase!");
      } else {
        await createEquipment({
          name: selectedItems.join(", ") || "Perlengkapan Umroh",
          category: categoryPayload,
          quantity: selectedItems.length,
          condition: conditionPayload,
        });
        showToast("Distribusi perlengkapan baru berhasil disimpan ke Supabase!");
      }
      await loadDistributions();
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error("Gagal menyimpan perlengkapan:", err);
      showToast("Gagal menyimpan perubahan ke database Supabase.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus catatan perlengkapan untuk "${name}"?`)) {
      try {
        await deleteEquipment(id);
        await loadDistributions();
        showToast("Catatan perlengkapan berhasil dihapus dari Supabase.");
      } catch (err: unknown) {
        console.error("Gagal menghapus perlengkapan:", err);
        showToast("Gagal menghapus data dari Supabase.");
      }
    }
  };

  const filteredDistributions = distributions.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.pilgrimName.toLowerCase().includes(q) ||
      item.bookingCode.toLowerCase().includes(q) ||
      item.packageName.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (statusFilter === "Lengkap") return item.status === "Lengkap";
    if (statusFilter === "Sebagian") return item.status === "Sebagian";
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-800 text-white px-4 py-3 text-xs font-medium shadow-lg animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section (Screenshot 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Package className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Perlengkapan Jamaah
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manajemen dan rekam distribusi koper, tas paspor, kain ihram, dan seragam batik jamaah.
            </p>
          </div>
        </div>

        <Link
          href="/equipment/create"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Perlengkapan</span>
        </Link>
      </div>

      {/* Filter / Search Bar (Screenshot 5) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setAppliedSearch(searchQuery);
            }}
            placeholder="Cari item perlengkapan, nama jamaah, kode booking..."
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Status</option>
              <option>Lengkap</option>
              <option>Sebagian</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setAppliedSearch(searchQuery)}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 text-xs font-semibold transition cursor-pointer"
          >
            Cari
          </button>
        </div>
      </div>

      {/* If No Distributions, Show EXACT Empty State from Screenshot 5 */}
      {filteredDistributions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[320px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-3">
            <Luggage className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            Belum ada data perlengkapan
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Catat distribusi koper, tas paspor, seragam, dan kain ihram untuk setiap jamaah.
          </p>
          <Link
            href="/equipment/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 text-xs mt-5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat Distribusi Baru</span>
          </Link>
        </div>
      ) : (
        /* If Distributions exist, Show Table */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                  <th className="pb-3.5 font-bold">NAMA JAMAAH &amp; BOOKING</th>
                  <th className="pb-3.5 font-bold">PAKET PERJALANAN</th>
                  <th className="pb-3.5 font-bold">ITEM PERLENGKAPAN DITERIMA</th>
                  <th className="pb-3.5 font-bold">METODE PENGAMBILAN</th>
                  <th className="pb-3.5 font-bold">STATUS</th>
                  <th className="pb-3.5 font-bold text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDistributions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{item.pilgrimName}</p>
                      <span className="font-mono text-[10px] text-slate-400">
                        {item.bookingCode}
                      </span>
                    </td>

                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <p className="text-slate-800">{item.packageName}</p>
                    </td>

                    <td className="py-3.5 pr-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium"
                          >
                            {it}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        {item.method === "Dikirim Ekspedisi" ? (
                          <Truck className="h-3.5 w-3.5 text-sky-600" />
                        ) : (
                          <Luggage className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        <span>{item.method}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.distributedDate} {item.courierReceipt && `• Resi: ${item.courierReceipt}`}
                      </p>
                    </td>

                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      {item.status === "Lengkap" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/50">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Lengkap</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/50">
                          Sebagian
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        <button
                          onClick={() => handleDelete(item.id, item.pilgrimName)}
                          className="p-1 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Perlengkapan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Luggage className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Catat Distribusi Perlengkapan
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Rekam penyerahan koper, tas paspor, dan seragam batik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NAMA JAMAAH <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formPilgrimName}
                  onChange={(e) => setFormPilgrimName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi atau Yushan Hakim"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    KODE REGISTRASI
                  </label>
                  <input
                    type="text"
                    value={formBookingCode}
                    onChange={(e) => setFormBookingCode(e.target.value)}
                    placeholder="REG-202611-002"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    TANGGAL PENYERAHAN
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="10 Okt 2026"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[10px] tracking-wider">
                  ITEM PERLENGKAPAN YANG DISERAHKAN
                </label>
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                  {allAvailableItems.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item)}
                        onChange={() => handleToggleItem(item)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  METODE PENGAMBILAN
                </label>
                <select
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Diambil di Kantor">Diambil di Kantor</option>
                  <option value="Dikirim Ekspedisi">Dikirim Ekspedisi (JNE / J&amp;T)</option>
                </select>
              </div>

              {formMethod === "Dikirim Ekspedisi" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NOMOR RESI PENGIRIMAN
                  </label>
                  <input
                    type="text"
                    value={formCourierReceipt}
                    onChange={(e) => setFormCourierReceipt(e.target.value)}
                    placeholder="Contoh: JNE-098234872"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
