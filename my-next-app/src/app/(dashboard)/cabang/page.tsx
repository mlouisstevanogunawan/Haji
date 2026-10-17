"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
} from "lucide-react";

import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  BranchRecord,
} from "@/services/branchService";

export interface BranchItem {
  id: string;
  name: string;
  code: string;
  avatarText: string;
  isHeadquarter: boolean;
  city: string;
  address: string;
  phone: string;
  email: string;
  type: "Kantor Pusat" | "Cabang";
  status: "Aktif" | "Nonaktif";
}

function mapRecordToBranchItem(b: BranchRecord): BranchItem {
  const isHq = !!b.is_headquarter;
  const code = b.code || "-";
  return {
    id: b.id,
    name: b.name,
    code: code,
    avatarText: code,
    isHeadquarter: isHq,
    city: b.city || "-",
    address: b.address || "-",
    phone: b.phone || "-",
    email: b.email || "-",
    type: isHq ? "Kantor Pusat" : "Cabang",
    status: b.is_active !== false ? "Aktif" : "Nonaktif",
  };
}

export default function CabangPage() {
  const [branches, setBranches] = React.useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = React.useState("");
  const [formCode, setFormCode] = React.useState("");
  const [formCity, setFormCity] = React.useState("");
  const [formAddress, setFormAddress] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formType, setFormType] = React.useState<"Kantor Pusat" | "Cabang">("Cabang");
  const [formStatus, setFormStatus] = React.useState<"Aktif" | "Nonaktif">("Aktif");

  // Delete Confirm State
  const [deletingBranch, setDeletingBranch] = React.useState<BranchItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadBranches = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const records = await getBranches();
      setBranches((records || []).map(mapRecordToBranchItem));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memuat cabang dari Supabase:", err);
      setBranches([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSearch = () => {
    setAppliedSearch(searchQuery.trim().toLowerCase());
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormCity("");
    setFormAddress("");
    setFormPhone("");
    setFormEmail("");
    setFormType("Cabang");
    setFormStatus("Aktif");
    setIsModalOpen(true);
  };

  const openEditModal = (b: BranchItem) => {
    setEditingId(b.id);
    setFormName(b.name);
    setFormCode(b.code);
    setFormCity(b.city);
    setFormAddress(b.address);
    setFormPhone(b.phone);
    setFormEmail(b.email);
    setFormType(b.type);
    setFormStatus(b.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      showToast("Nama dan Kode Cabang wajib diisi!");
      return;
    }

    try {
      const payload: Partial<BranchRecord> = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        city: formCity.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        is_headquarter: formType === "Kantor Pusat",
        is_active: formStatus === "Aktif",
      };

      if (editingId) {
        await updateBranch(editingId, payload);
        showToast(`Data cabang "${formName}" berhasil diperbarui di Supabase!`);
      } else {
        await createBranch(payload);
        showToast(`Cabang "${formName}" berhasil ditambahkan ke Supabase!`);
      }
      await loadBranches();
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal menyimpan cabang:", err);
      showToast(`Gagal menyimpan data cabang ke Supabase: ${msg}`);
    }
  };

  const confirmDelete = async () => {
    if (!deletingBranch) return;
    if (deletingBranch.isHeadquarter) {
      showToast("Kantor Pusat utama tidak dapat dihapus!");
      setDeletingBranch(null);
      return;
    }

    try {
      await deleteBranch(deletingBranch.id);
      await loadBranches();
      showToast(`Cabang "${deletingBranch.name}" berhasil dihapus dari Supabase.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal menghapus cabang:", err);
      showToast(`Gagal menghapus cabang dari Supabase: ${msg}`);
    } finally {
      setDeletingBranch(null);
    }
  };

  // Filter branches
  const filteredBranches = branches.filter((b) => {
    if (!appliedSearch) return true;
    const matchName = b.name.toLowerCase().includes(appliedSearch);
    const matchCode = b.code.toLowerCase().includes(appliedSearch);
    const matchCity = b.city.toLowerCase().includes(appliedSearch);
    return matchName || matchCode || matchCity;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Beranda</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Cabang</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Cabang</h1>
          <p className="text-sm text-gray-500">Daftar cabang travel</p>
        </div>
        <div>
          <Link
            href="/super-admin/cabang/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Cabang</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama atau kode cab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-64 sm:w-80 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Branches Table matching Screenshot 5 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KODE
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NAMA
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KOTA
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  TELEPON
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    Memuat data cabang dari Supabase...
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    {loadError
                      ? `Gagal memuat data cabang dari Supabase: ${loadError}`
                      : "Belum ada data cabang tersimpan di Supabase."}
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const isHq = branch.isHeadquarter;
                  return (
                    <tr
                      key={branch.id}
                      className="hover:bg-gray-50 transition border-b border-gray-100"
                    >
                      {/* Kode */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                        {branch.code}
                      </td>

                      {/* Nama */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                        <span>{branch.name}</span>
                        {isHq && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Pusat
                          </span>
                        )}
                      </td>

                      {/* Kota */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                        {branch.city}
                      </td>

                      {/* Telepon */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                        {branch.phone}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {branch.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEditModal(branch)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                          >
                            Edit
                          </button>
                          {!isHq && (
                            <button
                              onClick={() => setDeletingBranch(branch)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium transition cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
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

      {/* Modal Tambah / Edit Cabang */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Data Cabang" : "Tambah Kantor Cabang Baru"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingId
                    ? "Perbarui rincian informasi dan kontak kantor operasional"
                    : "Daftarkan kantor cabang baru ke dalam sistem jaringan"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Cabang / Kantor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang Medan Merdeka"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Cabang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: CAB-MDN"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kota Operasional
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Medan"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Nama Jalan No. XX, Kecamatan, Kelurahan"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="061-1234567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    placeholder="cabang@almedinahtravel.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipe Kantor
                  </label>
                  <select
                    value={formType}
                    onChange={(e) =>
                      setFormType(e.target.value as "Kantor Pusat" | "Cabang")
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
                  >
                    <option value="Cabang">Cabang</option>
                    <option value="Kantor Pusat">Kantor Pusat</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as "Aktif" | "Nonaktif")
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  {editingId ? "Simpan Perubahan" : "Tambah Cabang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-3">
              <Trash2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Hapus Cabang?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Apakah Anda yakin ingin menghapus data cabang{" "}
              <strong className="text-slate-800">{deletingBranch.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeletingBranch(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
