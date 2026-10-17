"use client";

import * as React from "react";
import {
  Plus,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

import {
  getGuides,
  createGuide,
  updateGuide,
  deleteGuide,
  GuideInsert,
} from "@/services/guideService";
import { getBranches, BranchRecord } from "@/services/branchService";

const DASH = "\u2014";

// Nilai kosong dari database selalu ditampilkan sebagai "—",
// tidak pernah diganti dengan data karangan.
function displayValue(v?: string | null): string {
  if (!v || v === "-") return DASH;
  return v;
}

export interface MuthawifItem {
  id: string;
  name: string;
  code: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  bio: string | null;
  branchId: string | null;
  hasAccount: boolean;
  status: "Aktif" | "Nonaktif";
}

type ToastKind = "success" | "error";

export default function MuthawifPage() {
  const [muthawifList, setMuthawifList] = React.useState<MuthawifItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("Semua Status");

  // Referensi cabang nyata (UUID) untuk dropdown modal
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form Fields (default kosong, tanpa nilai karangan)
  const [formName, setFormName] = React.useState("");
  const [formCode, setFormCode] = React.useState("");
  const [formGender, setFormGender] = React.useState("");
  const [formBranch, setFormBranch] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formSpecialization, setFormSpecialization] = React.useState("");
  const [formBio, setFormBio] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);

  // Toast
  const [toast, setToast] = React.useState<{ kind: ToastKind; msg: string } | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getGuides();
      // Sumber kebenaran: hanya baris nyata dari Supabase. Tidak ada fallback
      // demo dan tidak ada nilai karangan untuk kolom yang kosong.
      const mapped: MuthawifItem[] = (data ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        code: g.code || null,
        gender: g.gender || null,
        phone: g.phone || null,
        email: g.email || null,
        specialization: g.specialization || null,
        bio: g.bio || null,
        branchId: g.branch_id || null,
        hasAccount: g.user_id != null,
        status: g.is_active ? "Aktif" : "Nonaktif",
      }));
      setMuthawifList(mapped);
    } catch (err: unknown) {
      console.error("Failed to load guides from Supabase:", err);
      setMuthawifList([]);
      setLoadError(`Gagal memuat data muthawif: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    async function loadBranches() {
      try {
        setBranches((await getBranches()) || []);
      } catch (err) {
        console.error("Gagal memuat cabang:", err);
      }
    }
    loadBranches();
  }, []);

  const showToast = (kind: ToastKind, msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const resetForm = () => {
    setFormName("");
    setFormCode("");
    setFormGender("Laki-laki");
    setFormBranch("");
    setFormPhone("");
    setFormEmail("");
    setFormSpecialization("");
    setFormBio("");
    setFormIsActive(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MuthawifItem) => {
    setEditingId(item.id);
    setFormName(item.name || "");
    setFormCode(item.code || "");
    setFormGender(item.gender || "");
    setFormBranch(item.branchId || "");
    setFormPhone(item.phone || "");
    setFormEmail(item.email || "");
    setFormSpecialization(item.specialization || "");
    setFormBio(item.bio || "");
    setFormIsActive(item.status === "Aktif");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("error", "Nama muthawif wajib diisi!");
      return;
    }

    const payload: GuideInsert = {
      name: formName.trim(),
      code: formCode.trim() || null,
      gender: formGender || null,
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      specialization: formSpecialization.trim() || null,
      bio: formBio.trim() || null,
      branch_id: formBranch || null,
      is_active: formIsActive,
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateGuide(editingId, payload);
        showToast("success", "Perubahan data muthawif tersimpan di database.");
      } else {
        await createGuide(payload);
        showToast("success", "Muthawif baru berhasil disimpan ke database.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      console.error("Gagal menyimpan data muthawif:", err);
      // Tulis gagal: tampilkan pesan asli dan BIARKAN modal terbuka.
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data muthawif "${name}"?`)) {
      try {
        await deleteGuide(id);
        await loadData();
        showToast("success", "Data muthawif berhasil dihapus.");
      } catch (err: unknown) {
        showToast("error", `Gagal menghapus muthawif: ${(err as Error).message}`);
      }
    }
  };

  const filteredMuthawif = muthawifList.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.name || "").toLowerCase().includes(q) ||
      (item.code || "").toLowerCase().includes(q) ||
      (item.phone || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q) ||
      (item.specialization || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "Semua Status" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium shadow-lg animate-fade-in ${
            toast.kind === "error"
              ? "bg-red-700 text-white"
              : "bg-teal-800 text-white"
          }`}
        >
          {toast.kind === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-200" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-teal-300" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Banner kegagalan baca (pesan error asli, bukan data demo) */}
      {loadError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Header section with Breadcrumb & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">
            <Link href="/dashboard" className="hover:text-gray-600 transition">
              Beranda
            </Link>{" "}
            &gt; <span className="text-gray-600">Muthawif</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Muthawif / Pembimbing
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Daftar muthawif &amp; pembimbing ibadah
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Muthawif</span>
          </button>
          <Link
            href="/muthawif/tambah"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-xs font-medium transition cursor-pointer"
          >
            Formulir Lengkap
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-xs flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setAppliedSearch(searchQuery);
          }}
          placeholder="Cari nama / kode..."
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs text-gray-800 placeholder-gray-400 w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />

        {/* Status Dropdown (nilai nyata kolom is_active) */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs text-gray-700 pr-9 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        <button
          onClick={() => setAppliedSearch(searchQuery)}
          className="rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-xs font-medium transition cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Table Data */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3 px-6">KODE / NAMA</th>
                <th className="py-3 px-6">GENDER</th>
                <th className="py-3 px-6">KONTAK</th>
                <th className="py-3 px-6">SPESIALISASI</th>
                <th className="py-3 px-6">AKUN</th>
                <th className="py-3 px-6">STATUS</th>
                <th className="py-3 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Memuat data muthawif...
                  </td>
                </tr>
              ) : muthawifList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Belum ada data muthawif di database.
                  </td>
                </tr>
              ) : filteredMuthawif.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Tidak ada muthawif yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredMuthawif.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition">
                    {/* Kode / Nama */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <span className="text-[11px] text-gray-400 block mt-0.5 font-mono">
                        {displayValue(item.code)}
                      </span>
                    </td>

                    {/* Gender */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {item.gender === "Laki-laki" ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          Laki-laki
                        </span>
                      ) : item.gender === "Perempuan" ? (
                        <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-700">
                          Perempuan
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold">{DASH}</span>
                      )}
                    </td>

                    {/* Kontak */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-medium text-teal-600">{displayValue(item.phone)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{displayValue(item.email)}</p>
                    </td>

                    {/* Spesialisasi */}
                    <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                      {displayValue(item.specialization)}
                    </td>

                    {/* Akun (nyata: user_id terisi) */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {item.hasAccount ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold">{DASH}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === "Aktif"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
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

      {/* Modal Tambah/Edit Muthawif */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-bold text-gray-900">
                {editingId ? "Edit Pembimbing Ibadah" : "Tambah Muthawif Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NAMA LENGKAP &amp; GELAR <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ustadz Abdullah"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    KODE MUTHAWIF
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Contoh: GD-001"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    GENDER
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">— Pilih —</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                  CABANG
                </label>
                <select
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">— Tanpa Cabang —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                  SPESIALISASI
                </label>
                <input
                  type="text"
                  value={formSpecialization}
                  onChange={(e) => setFormSpecialization(e.target.value)}
                  placeholder="Mis: Pembimbing Manasik, Penceramah"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NOMOR TELEPON / WHATSAPP
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 0811-1234-5678"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Alamat email (opsional)"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                  BIO
                </label>
                <textarea
                  rows={2}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Bio / profil singkat muthawif..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="guideIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="guideIsActive" className="text-xs text-gray-700 font-medium cursor-pointer select-none">
                  Aktif
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Muthawif"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
