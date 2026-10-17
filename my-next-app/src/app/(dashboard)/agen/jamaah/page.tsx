"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ChevronDown, X } from "lucide-react";
import { getJamaahList, updateJamaah, JamaahProfile } from "@/services/jamaahService";

interface ReferralJamaahItem {
  id: string;
  code: string;
  name: string;
  gender: "Laki-laki" | "Perempuan";
  nik: string;
  phone: string;
  email: string;
  passportNumber: string;
  passportExpiry: string;
  agent: string;
  branch: string;
  status: string;
}

export default function AgenJamaahReferralPage() {
  const [jamaahList, setJamaahList] = React.useState<ReferralJamaahItem[]>([]);
  const [searchInput, setSearchInput] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [activeSearch, setActiveSearch] = React.useState("");
  const [activeStatus, setActiveStatus] = React.useState("Semua Status");

  // Detail & Edit Modals
  const [detailModalItem, setDetailModalItem] = React.useState<ReferralJamaahItem | null>(null);
  const [editModalItem, setEditModalItem] = React.useState<ReferralJamaahItem | null>(null);


  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load from Supabase
  const loadData = React.useCallback(async () => {
    try {
      const data = await getJamaahList();
      const mapped: ReferralJamaahItem[] = (data || []).map((d: JamaahProfile) => ({
        id: d.id,
        code: d.code || "-",
        name: d.name,
        gender: d.gender || "Laki-laki",
        nik: d.nik || "-",
        phone: d.phone || "-",
        email: d.email || "-",
        passportNumber: d.passportNumber || "-",
        passportExpiry: d.passportExpiry || "-",
        agent: d.agent || "-",
        branch: d.branch || "-",
        status: d.status || "-",
      }));
      setJamaahList(mapped);
    } catch (err: unknown) {
      console.error("Gagal memuat data jamaah:", err);
      setJamaahList([]);
      showToast(`Gagal memuat data jamaah: ${(err as Error).message}`);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setActiveStatus(statusFilter);
  };

  const filteredList = jamaahList.filter((item) => {
    const q = activeSearch.toLowerCase();
    const matchQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.nik.toLowerCase().includes(q) ||
      item.passportNumber.toLowerCase().includes(q);

    const matchStatus =
      activeStatus === "Semua Status" ||
      item.status.toLowerCase() === activeStatus.toLowerCase();

    return matchQuery && matchStatus;
  });

  // Placeholder "-" hanya untuk tampilan tabel; saat form dibuka dikosongkan
  // supaya tidak ikut tersimpan ke Supabase dan input email tetap valid.
  const openEditModal = (item: ReferralJamaahItem) => {
    const bersih = (value: string) => (value === "-" ? "" : value);
    setEditModalItem({
      ...item,
      nik: bersih(item.nik),
      phone: bersih(item.phone),
      email: bersih(item.email),
      passportNumber: bersih(item.passportNumber),
      passportExpiry: bersih(item.passportExpiry),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem) return;

    try {
      await updateJamaah(editModalItem.id, {
        name: editModalItem.name,
        phone: editModalItem.phone,
        email: editModalItem.email,
        passportNumber: editModalItem.passportNumber,
        passportExpiry: editModalItem.passportExpiry,
      });
      setEditModalItem(null);
      await loadData();
      showToast("Perubahan data jamaah berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal memperbarui data jamaah:", err);
      showToast(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section with Breadcrumb & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/agen/dashboard" className="hover:text-gray-600 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <span className="text-gray-500 font-medium">Jamaah</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Jamaah</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daftar jamaah umroh &amp; haji</p>
        </div>

        <div>
          <Link
            href="/agen/jamaah/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jamaah</span>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] max-w-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama / NIK / paspor"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Belum Bayar">Belum Bayar</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <button
          type="submit"
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-2xs cursor-pointer"
        >
          Cari
        </button>
      </form>

      {/* Tabel Jamaah Referral */}
      <div className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/80">
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  KODE / NAMA
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  GENDER
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  NIK
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  KONTAK
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  PASPOR
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  AGEN
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                    Tidak ada data jamaah referral ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/70 transition-colors border-b border-gray-100"
                  >
                    {/* Kode / Nama */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-semibold text-gray-900 leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{item.code}</p>
                    </td>

                    {/* Gender */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {item.gender === "Laki-laki" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                          Laki-laki
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-pink-50 text-pink-700">
                          Perempuan
                        </span>
                      )}
                    </td>

                    {/* NIK */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-normal">
                      {item.nik}
                    </td>

                    {/* Kontak */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <p className="text-xs text-teal-700 font-normal leading-tight">{item.phone}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{item.email}</p>
                    </td>

                    {/* Paspor */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <p className="text-xs text-gray-800 font-normal leading-tight">
                        {item.passportNumber}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                        {item.passportExpiry}
                      </p>
                    </td>

                    {/* Agen */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600">
                      {item.agent}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setDetailModalItem(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          Lihat
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          Edit
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

      {/* Modal Detail Jamaah (Lihat) */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Detail Jamaah</h3>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Kode</span>
                <span className="font-semibold text-gray-800">{detailModalItem.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Nama Lengkap</span>
                <span className="font-semibold text-gray-800">{detailModalItem.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Gender</span>
                <span className="font-semibold text-gray-800">{detailModalItem.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">NIK</span>
                <span className="font-semibold text-gray-800">{detailModalItem.nik}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Telepon</span>
                <span className="font-semibold text-gray-800">{detailModalItem.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Email</span>
                <span className="font-semibold text-gray-800">{detailModalItem.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Nomor Paspor</span>
                <span className="font-semibold text-gray-800">
                  {detailModalItem.passportNumber} ({detailModalItem.passportExpiry})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Agen Referral</span>
                <span className="font-semibold text-teal-700">{detailModalItem.agent}</span>
              </div>
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Jamaah (Edit) */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Edit Data Jamaah</h3>
              <button
                type="button"
                onClick={() => setEditModalItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editModalItem.name}
                  onChange={(e) =>
                    setEditModalItem({ ...editModalItem, name: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Telepon</label>
                  <input
                    type="text"
                    value={editModalItem.phone}
                    onChange={(e) =>
                      setEditModalItem({ ...editModalItem, phone: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editModalItem.email}
                    onChange={(e) =>
                      setEditModalItem({ ...editModalItem, email: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Nomor Paspor</label>
                  <input
                    type="text"
                    value={editModalItem.passportNumber}
                    onChange={(e) =>
                      setEditModalItem({ ...editModalItem, passportNumber: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Kadaluarsa Paspor</label>
                  <input
                    type="text"
                    value={editModalItem.passportExpiry}
                    onChange={(e) =>
                      setEditModalItem({ ...editModalItem, passportExpiry: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditModalItem(null)}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
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
