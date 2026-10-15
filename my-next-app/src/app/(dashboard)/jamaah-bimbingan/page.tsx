"use client";

import * as React from "react";
import {
  Users,
  Plus,
  Search,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  MessageCircle,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";

import {
  getJamaahList,
  createJamaah,
  deleteJamaah,
  JamaahProfile,
} from "@/services/jamaahService";

interface JamaahItem {
  id: string;
  name: string;
  code: string;
  gender: "Laki-laki" | "Perempuan";
  nik: string;
  phone: string;
  paspor: string;
  expDate?: string;
  isExpSoon?: boolean;
  branch: string;
  agent: string;
}

function mapProfileToItem(p: JamaahProfile): JamaahItem {
  return {
    id: p.id,
    name: p.name,
    code: p.code || `PLG-${p.id.slice(0, 6).toUpperCase()}`,
    gender: p.gender || "Laki-laki",
    nik: p.nik || "-",
    phone: p.phone || "-",
    paspor: p.passportNumber || "-",
    expDate: p.passportExpiry !== "-" ? `Exp: ${p.passportExpiry}` : undefined,
    isExpSoon: Boolean(p.isPassportExpiringSoon),
    branch: p.branch || "Kantor Pusat Jakarta",
    agent: p.agent || "Bimbingan Muthawif",
  };
}

export default function JamaahBimbinganPage() {
  const [jamaahList, setJamaahList] = React.useState<JamaahItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");

  // Modal states
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [detailItem, setDetailItem] = React.useState<JamaahItem | null>(null);

  // New Jamaah Form
  const [newName, setNewName] = React.useState("");
  const [newGender, setNewGender] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [newNik, setNewNik] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [newPaspor, setNewPaspor] = React.useState("");
  const [newBranch, setNewBranch] = React.useState("Kantor Pusat Jakarta");

  const loadJamaah = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getJamaahList();
      setJamaahList(data.map(mapProfileToItem));
    } catch (err: unknown) {
      console.error("Gagal memuat jamaah bimbingan:", err);
      setJamaahList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadJamaah();
  }, [loadJamaah]);

  const filteredData = jamaahList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nik.includes(searchTerm) ||
      item.paspor.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "Paspor Kadaluarsa") {
      return matchesSearch && item.isExpSoon;
    }
    return matchesSearch;
  });

  const handleAddJamaah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newNik) return;

    try {
      await createJamaah({
        name: newName.trim(),
        gender: newGender,
        nik: newNik.trim(),
        phone: newPhone.trim() || "-",
        passportNumber: newPaspor.trim() || "-",
        passportExpiry: newPaspor ? "Okt 2031" : "-",
        isPassportExpiringSoon: false,
        branch: newBranch,
        agent: "Bimbingan Muthawif",
      });
      await loadJamaah();
      setShowAddModal(false);
      setNewName("");
      setNewNik("");
      setNewPhone("");
      setNewPaspor("");
    } catch (err) {
      console.error("Gagal menambahkan jamaah bimbingan:", err);
      alert("Gagal menyimpan jamaah ke database Supabase.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data jamaah ini?")) {
      try {
        await deleteJamaah(id);
        await loadJamaah();
      } catch (err) {
        console.error("Gagal menghapus jamaah:", err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Data Jamaah
            </h1>
            <p className="text-xs text-slate-400">
              Master database jamaah Umroh &amp; Haji, rekam paspor, dan kontak darurat.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jamaah</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama jamaah, NIK, nomor paspor, kode..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option>Semua Status</option>
              <option>Paspor Kadaluarsa</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 px-4 py-1.5 text-xs font-semibold transition">
            Cari
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">KODE &amp; NAMA JAMAAH</th>
                <th className="pb-3.5 font-bold">GENDER</th>
                <th className="pb-3.5 font-bold">NIK (KTP)</th>
                <th className="pb-3.5 font-bold">KONTAK &amp; WHATSAPP</th>
                <th className="pb-3.5 font-bold">PASPOR &amp; KADALUARSA</th>
                <th className="pb-3.5 font-bold">CABANG / AGEN</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  {/* Name & Code */}
                  <td className="py-3.5 pr-3">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {item.code}
                    </p>
                  </td>

                  {/* Gender */}
                  <td className="py-3.5 pr-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        item.gender === "Laki-laki"
                          ? "bg-blue-50 text-blue-600 border-blue-200/60"
                          : "bg-pink-50 text-pink-600 border-pink-200/60"
                      }`}
                    >
                      {item.gender}
                    </span>
                  </td>

                  {/* NIK */}
                  <td className="py-3.5 pr-3 font-mono text-slate-600 whitespace-nowrap">
                    {item.nik}
                  </td>

                  {/* Phone & WhatsApp */}
                  <td className="py-3.5 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-slate-700">
                      <span>{item.phone}</span>
                      <a
                        href={`https://wa.me/${item.phone.replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat WhatsApp"
                        className="text-emerald-500 hover:text-emerald-600 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5 fill-emerald-100" />
                      </a>
                    </div>
                  </td>

                  {/* Passport & Exp */}
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-slate-800">{item.paspor}</p>
                    {item.expDate && (
                      <div className="mt-0.5">
                        {item.isExpSoon ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 text-red-600 border border-red-200/70 px-1.5 py-0.5 text-[10px] font-semibold">
                            <AlertTriangle className="h-2.5 w-2.5 text-red-500" />
                            {item.expDate}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {item.expDate}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Branch & Agent */}
                  <td className="py-3.5 pr-3">
                    <p className="text-slate-800 font-medium">{item.branch}</p>
                    <p className="text-[10px] text-slate-400">{item.agent}</p>
                  </td>

                  {/* Action Icons */}
                  <td className="py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 text-slate-400">
                      <button
                        onClick={() => setDetailItem(item)}
                        title="Lihat Detail"
                        className="p-1 hover:text-slate-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => alert(`Edit jamaah ${item.name}`)}
                        title="Ubah Data"
                        className="p-1 hover:text-slate-700 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Hapus"
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

      {/* Modal Tambah Jamaah (100% Fungsional) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Jamaah Bimbingan Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddJamaah} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Lengkap Sesuai KTP / Paspor
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Muhammad Ilham"
                  className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Cabang
                  </label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none"
                  >
                    <option>Kantor Pusat Jakarta</option>
                    <option>Cabang Surabaya</option>
                    <option>Cabang Bandung</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nomor Induk Kependudukan (NIK)
                </label>
                <input
                  type="text"
                  required
                  value={newNik}
                  onChange={(e) => setNewNik(e.target.value)}
                  placeholder="16 Digit NIK KTP"
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nomor Paspor (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newPaspor}
                    onChange={(e) => setNewPaspor(e.target.value)}
                    placeholder="Contoh: E889901"
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Simpan Jamaah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Jamaah */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Detail Profil Jamaah
              </h3>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Kode Jamaah:</span>
                <span className="font-mono font-bold text-slate-900">{detailItem.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Nama Lengkap:</span>
                <span className="font-semibold text-slate-900">{detailItem.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Jenis Kelamin:</span>
                <span className="font-medium text-slate-800">{detailItem.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">NIK (KTP):</span>
                <span className="font-mono text-slate-800">{detailItem.nik}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Nomor Paspor:</span>
                <span className="font-mono text-slate-800">{detailItem.paspor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Cabang:</span>
                <span className="text-slate-800">{detailItem.branch}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Pembimbing:</span>
                <span className="text-slate-800 font-medium">Ustadz Abdullah</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
