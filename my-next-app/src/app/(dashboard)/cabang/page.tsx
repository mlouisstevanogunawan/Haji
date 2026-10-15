"use client";

import * as React from "react";
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
  const isHq = b.is_headquarter;
  const avatar = isHq ? "HO-" : (b.code ? b.code.split("-")[0]?.slice(0, 3).toUpperCase() : "CAB");
  return {
    id: b.id,
    name: b.name,
    code: b.code,
    avatarText: avatar || "CAB",
    isHeadquarter: isHq,
    city: b.city || "-",
    address: b.address || "-",
    phone: b.phone || "-",
    email: b.email || "-",
    type: isHq ? "Kantor Pusat" : "Cabang",
    status: b.is_active ? "Aktif" : "Nonaktif",
  };
}

export default function CabangPage() {
  const [branches, setBranches] = React.useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
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
    try {
      const records = await getBranches();
      setBranches(records.map(mapRecordToBranchItem));
    } catch (err: unknown) {
      console.error("Gagal memuat cabang dari Supabase:", err);
      setBranches([]);
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
    setFormCode("CAB-" + Math.floor(100 + Math.random() * 900));
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
      console.error("Gagal menyimpan cabang:", err);
      showToast("Gagal menyimpan data cabang ke Supabase.");
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
      console.error("Gagal menghapus cabang:", err);
      showToast("Gagal menghapus cabang dari Supabase.");
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
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-sm">
            <Building2 className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Kelola Cabang
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manajemen data kantor cabang dan kantor pusat operasional Umroh & Haji
            </p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Cabang</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-2 sm:p-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama cabang, kode, atau kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-xl bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition border border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Branches Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">KODE & NAMA CABANG</th>
                <th className="px-5 py-3.5">KOTA & ALAMAT</th>
                <th className="px-5 py-3.5">KONTAK</th>
                <th className="px-5 py-3.5">TIPE</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5 text-right sm:text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada cabang yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const isHq = branch.isHeadquarter;
                  return (
                    <tr
                      key={branch.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* Kode & Nama Cabang */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                              isHq
                                ? "bg-teal-50 text-teal-600 border border-teal-100"
                                : branch.avatarText === "SBY"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                          >
                            {branch.avatarText}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-800">
                                {branch.name}
                              </span>
                              {isHq && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200/80 inline-flex items-center gap-0.5">
                                  <Sparkles className="h-2.5 w-2.5" /> Pusat
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                              Kode: {branch.code}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kota & Alamat */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{branch.city}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {branch.address}
                        </p>
                      </td>

                      {/* Kontak */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{branch.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{branch.email}</span>
                        </div>
                      </td>

                      {/* Tipe */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isHq
                              ? "bg-teal-50 text-teal-700 border border-teal-200/60"
                              : "bg-slate-100 text-slate-600 border border-slate-200/60"
                          }`}
                        >
                          {branch.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            branch.status === "Aktif"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {branch.status === "Aktif" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {branch.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right sm:text-center">
                        <div className="flex items-center justify-end sm:justify-center gap-2">
                          <button
                            onClick={() => openEditModal(branch)}
                            title="Edit Cabang"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {!isHq && (
                            <button
                              onClick={() => setDeletingBranch(branch)}
                              title="Hapus Cabang"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                            >
                              <Trash2 className="h-4 w-4" />
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
