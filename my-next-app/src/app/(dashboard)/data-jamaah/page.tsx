"use client";

import * as React from "react";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

import {
  getJamaahList,
  createJamaah,
  updateJamaah,
  deleteJamaah,
  JamaahProfile,
} from "@/services/jamaahService";
import { getBranches, BranchRecord } from "@/services/branchService";
import { getAgents, AgentRow } from "@/services/agentService";

const DASH = "\u2014";

// Nilai "-" hanyalah placeholder tampilan dari service; saat dipakai menampilkan
// data nyata kita ganti dengan em-dash agar tidak dibaca sebagai isi kolom.
function displayValue(v?: string | null): string {
  if (!v || v === "-") return DASH;
  return v;
}

// Saat form dibuka, placeholder "-" dikosongkan supaya tidak ikut tersimpan
// ke Supabase sebagai nilai asli.
function editableValue(v?: string | null): string {
  return v && v !== "-" ? v : "";
}

type ToastKind = "success" | "error";

export default function JamaahPage() {
  const [jamaahList, setJamaahList] = React.useState<JamaahProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  // Referensi nyata untuk dropdown modal (id cabang & kode agen asli dari DB).
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [agents, setAgents] = React.useState<AgentRow[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewingItem, setViewingItem] = React.useState<JamaahProfile | null>(null);

  // Form Fields (kosongkan default, tanpa nilai karangan)
  const [formName, setFormName] = React.useState("");
  const [formGender, setFormGender] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [formNik, setFormNik] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formBirthPlace, setFormBirthPlace] = React.useState("");
  const [formBirthDate, setFormBirthDate] = React.useState("");
  const [formBloodType, setFormBloodType] = React.useState("");
  const [formCity, setFormCity] = React.useState("");
  const [formAddress, setFormAddress] = React.useState("");
  const [formPassport, setFormPassport] = React.useState("");
  const [formPassportIssuePlace, setFormPassportIssuePlace] = React.useState("");
  const [formPassportIssueDate, setFormPassportIssueDate] = React.useState("");
  const [formPassportExpiry, setFormPassportExpiry] = React.useState("");
  const [formMahramName, setFormMahramName] = React.useState("");
  const [formMahramRelation, setFormMahramRelation] = React.useState("");
  const [formEmergencyName, setFormEmergencyName] = React.useState("");
  const [formEmergencyPhone, setFormEmergencyPhone] = React.useState("");
  const [formHealthNotes, setFormHealthNotes] = React.useState("");
  const [formBranch, setFormBranch] = React.useState("");
  const [formAgent, setFormAgent] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);

  // Toast
  const [toast, setToast] = React.useState<{ kind: ToastKind; msg: string } | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getJamaahList();
      // Sumber kebenaran: baris nyata dari profiles. Tidak ada fallback demo,
      // tidak ada nilai karangan; "-" bawaan service ditampilkan sebagai "—".
      setJamaahList(data ?? []);
    } catch (err: unknown) {
      console.error("Failed to load jamaah data from Supabase:", err);
      setJamaahList([]);
      setLoadError(`Gagal memuat data jamaah: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    async function loadRefs() {
      try {
        setBranches(await getBranches());
      } catch (err) {
        console.error("Gagal memuat cabang:", err);
      }
      try {
        setAgents(await getAgents());
      } catch (err) {
        console.error("Gagal memuat agen:", err);
      }
    }
    loadRefs();
  }, []);

  const showToast = (kind: ToastKind, msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const resetForm = () => {
    setFormName("");
    setFormGender("Laki-laki");
    setFormNik("");
    setFormPhone("");
    setFormEmail("");
    setFormBirthPlace("");
    setFormBirthDate("");
    setFormBloodType("");
    setFormCity("");
    setFormAddress("");
    setFormPassport("");
    setFormPassportIssuePlace("");
    setFormPassportIssueDate("");
    setFormPassportExpiry("");
    setFormMahramName("");
    setFormMahramRelation("");
    setFormEmergencyName("");
    setFormEmergencyPhone("");
    setFormHealthNotes("");
    setFormBranch("");
    setFormAgent("");
    setFormIsActive(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JamaahProfile) => {
    setEditingId(item.id);
    setFormName(item.name || "");
    setFormGender(item.gender === "Perempuan" ? "Perempuan" : "Laki-laki");
    setFormNik(editableValue(item.nik));
    setFormPhone(editableValue(item.phone));
    setFormEmail(editableValue(item.email));
    setFormBirthPlace(editableValue(item.birthPlace));
    setFormBirthDate(editableValue(item.birthDate));
    setFormBloodType(editableValue(item.bloodType));
    setFormCity(editableValue(item.city));
    setFormAddress(editableValue(item.address));
    setFormPassport(editableValue(item.passportNumber));
    setFormPassportIssuePlace(editableValue(item.passportIssuePlace));
    setFormPassportIssueDate(editableValue(item.passportIssueDate));
    setFormPassportExpiry(editableValue(item.passportExpiry));
    setFormMahramName(editableValue(item.mahramName));
    setFormMahramRelation(editableValue(item.mahramRelation));
    setFormEmergencyName(editableValue(item.emergencyContactName));
    setFormEmergencyPhone(editableValue(item.emergencyContactPhone));
    setFormHealthNotes(editableValue(item.healthNotes));
    // Cocokkan nama cabang yang dikembalikan getJamaahList() ke id cabang nyata.
    const matchedBranch = branches.find((b) => b.name === item.branch);
    setFormBranch(matchedBranch ? matchedBranch.id : "");
    setFormAgent(item.agent && item.agent !== "Langsung" ? item.agent : "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("error", "Nama lengkap jamaah wajib diisi!");
      return;
    }
    if (!editingId && !formPhone.trim()) {
      showToast("error", "Nomor telepon wajib diisi sebagai kontak utama jamaah.");
      return;
    }
    if (editingId && (editingId.startsWith("jm-") || editingId.startsWith("local-"))) {
      showToast("error", "Data contoh tidak dapat disimpan.");
      return;
    }

    const payload: Partial<JamaahProfile> = {
      name: formName.trim(),
      gender: formGender,
      nik: formNik.trim() || null,
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      birthPlace: formBirthPlace.trim() || null,
      birthDate: formBirthDate || null,
      bloodType: formBloodType || null,
      city: formCity.trim() || null,
      address: formAddress.trim() || null,
      passportNumber: formPassport.trim() || null,
      passportIssuePlace: formPassportIssuePlace.trim() || null,
      passportIssueDate: formPassportIssueDate || null,
      // passport_expiry bertipe date di Postgres: kirim ISO YYYY-MM-DD atau null.
      passportExpiry: formPassportExpiry || null,
      mahramName: formMahramName.trim() || null,
      mahramRelation: formMahramRelation.trim() || null,
      emergencyContactName: formEmergencyName.trim() || null,
      emergencyContactPhone: formEmergencyPhone.trim() || null,
      healthNotes: formHealthNotes.trim() || null,
      branchId: formBranch || null,
      agent: formAgent || null,
      is_active: formIsActive,
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateJamaah(editingId, payload);
        showToast("success", "Perubahan data jamaah tersimpan di database.");
      } else {
        await createJamaah(payload);
        showToast("success", "Jamaah baru berhasil disimpan ke database.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      console.error("Gagal menyimpan data jamaah:", err);
      // Tulis gagal: tampilkan pesan asli dan BIARKAN modal terbuka.
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id.startsWith("jm-") || id.startsWith("local-")) {
      showToast("error", "Data contoh tidak dapat dihapus.");
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus data jamaah "${name}"?`)) {
      try {
        await deleteJamaah(id);
        await loadData();
        showToast("success", "Data jamaah berhasil dihapus.");
      } catch (err: unknown) {
        showToast("error", `Gagal menghapus data jamaah: ${(err as Error).message}`);
      }
    }
  };

  const filteredJamaah = jamaahList.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    return (
      !q ||
      (item.name || "").toLowerCase().includes(q) ||
      (item.nik || "").toLowerCase().includes(q) ||
      (item.code || "").toLowerCase().includes(q) ||
      (item.passportNumber || "").toLowerCase().includes(q) ||
      (item.phone || "").toLowerCase().includes(q)
    );
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
            &gt; <span className="text-gray-600">Jamaah</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Jamaah
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Daftar jamaah umroh &amp; haji
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jamaah</span>
          </button>
          <Link
            href="/jamaah/tambah"
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
          placeholder="Cari nama / NIK / paspor"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs text-gray-800 placeholder-gray-400 w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />

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
                <th className="py-3 px-6">NIK</th>
                <th className="py-3 px-6">KONTAK</th>
                <th className="py-3 px-6">PASPOR</th>
                <th className="py-3 px-6">AGEN</th>
                <th className="py-3 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Memuat data jamaah...
                  </td>
                </tr>
              ) : jamaahList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Belum ada data jamaah di database.
                  </td>
                </tr>
              ) : filteredJamaah.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Tidak ada jamaah yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredJamaah.map((item) => (
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
                      {item.gender === "Perempuan" ? (
                        <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-700">
                          Perempuan
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          Laki-laki
                        </span>
                      )}
                    </td>

                    {/* NIK */}
                    <td className="py-4 px-6 font-mono text-gray-700 whitespace-nowrap">
                      {displayValue(item.nik)}
                    </td>

                    {/* Kontak */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-medium text-teal-600">{displayValue(item.phone)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{displayValue(item.email)}</p>
                    </td>

                    {/* Paspor */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-mono font-medium text-gray-900">
                        {displayValue(item.passportNumber)}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {displayValue(item.passportExpiry)}
                      </p>
                    </td>

                    {/* Agen */}
                    <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                      {displayValue(item.agent)}
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Lihat</span>
                        </button>
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

      {/* Modal Tambah/Edit Jamaah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-bold text-gray-900">
                {editingId ? "Edit Data Jamaah" : "Tambah Jamaah Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NAMA LENGKAP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nama lengkap sesuai KTP"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    JENIS KELAMIN
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as "Laki-laki" | "Perempuan")}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NIK (16 DIGIT)
                  </label>
                  <input
                    type="text"
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    placeholder="Nomor Induk Kependudukan"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NOMOR TELEPON / WA {!editingId && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Nomor telepon aktif"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    KOTA
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Kota domisili"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                  ALAMAT
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Alamat lengkap domisili"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    TEMPAT LAHIR
                  </label>
                  <input
                    type="text"
                    value={formBirthPlace}
                    onChange={(e) => setFormBirthPlace(e.target.value)}
                    placeholder="Kota lahir"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    TANGGAL LAHIR
                  </label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    GOLONGAN DARAH
                  </label>
                  <select
                    value={formBloodType}
                    onChange={(e) => setFormBloodType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">- Pilih -</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
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
                    <option value="">- Pilih Cabang -</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="font-bold text-gray-700 uppercase text-[10px] tracking-wider mb-2">
                  Paspor
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      NOMOR PASPOR
                    </label>
                    <input
                      type="text"
                      value={formPassport}
                      onChange={(e) => setFormPassport(e.target.value)}
                      placeholder="Nomor paspor"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 font-mono uppercase placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      TEMPAT PENERBITAN
                    </label>
                    <input
                      type="text"
                      value={formPassportIssuePlace}
                      onChange={(e) => setFormPassportIssuePlace(e.target.value)}
                      placeholder="Kantor imigrasi"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      TANGGAL TERBIT
                    </label>
                    <input
                      type="date"
                      value={formPassportIssueDate}
                      onChange={(e) => setFormPassportIssueDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      MASA BERLAKU PASPOR
                    </label>
                    <input
                      type="date"
                      value={formPassportExpiry}
                      onChange={(e) => setFormPassportExpiry(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="font-bold text-gray-700 uppercase text-[10px] tracking-wider mb-2">
                  Mahram &amp; Kontak Darurat
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      NAMA MAHRAM
                    </label>
                    <input
                      type="text"
                      value={formMahramName}
                      onChange={(e) => setFormMahramName(e.target.value)}
                      placeholder="Nama mahram (jika ada)"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      HUBUNGAN MAHRAM
                    </label>
                    <input
                      type="text"
                      value={formMahramRelation}
                      onChange={(e) => setFormMahramRelation(e.target.value)}
                      placeholder="Mis: Suami, Ayah"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      KONTAK DARURAT
                    </label>
                    <input
                      type="text"
                      value={formEmergencyName}
                      onChange={(e) => setFormEmergencyName(e.target.value)}
                      placeholder="Nama keluarga terdekat"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      TELEPON DARURAT
                    </label>
                    <input
                      type="text"
                      value={formEmergencyPhone}
                      onChange={(e) => setFormEmergencyPhone(e.target.value)}
                      placeholder="Nomor kontak darurat"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                    CATATAN KESEHATAN
                  </label>
                  <textarea
                    rows={2}
                    value={formHealthNotes}
                    onChange={(e) => setFormHealthNotes(e.target.value)}
                    placeholder="Riwayat penyakit, alergi, obat"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase text-[10px] tracking-wider">
                      AGEN REFERRAL
                    </label>
                    <select
                      value={formAgent}
                      onChange={(e) => setFormAgent(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">- Tanpa Agen -</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.code || a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      Akun aktif
                    </label>
                  </div>
                </div>
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
                  {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Jamaah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Jamaah */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{viewingItem.name}</h3>
                <p className="text-[10px] font-mono text-gray-400">{displayValue(viewingItem.code)}</p>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                ["Jenis Kelamin", viewingItem.gender],
                ["NIK", viewingItem.nik],
                ["Telepon", viewingItem.phone],
                ["Email", viewingItem.email],
                ["Tempat Lahir", viewingItem.birthPlace],
                ["Tanggal Lahir", viewingItem.birthDate],
                ["Golongan Darah", viewingItem.bloodType],
                ["Kota", viewingItem.city],
                ["Alamat", viewingItem.address],
                ["Nomor Paspor", viewingItem.passportNumber],
                ["Tempat Terbit Paspor", viewingItem.passportIssuePlace],
                ["Tanggal Terbit Paspor", viewingItem.passportIssueDate],
                ["Paspor Tiba Pada", viewingItem.passportExpiry],
                ["Mahram", viewingItem.mahramName],
                ["Hubungan Mahram", viewingItem.mahramRelation],
                ["Kontak Darurat", viewingItem.emergencyContactName],
                ["Telepon Darurat", viewingItem.emergencyContactPhone],
                ["Cabang", viewingItem.branch],
                ["Agen Referral", viewingItem.agent],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-4 py-1 border-b border-gray-50">
                  <span className="text-gray-400 shrink-0">{label}:</span>
                  <span className="font-medium text-gray-800 text-right break-words">
                    {displayValue(value as string | null)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between gap-4 py-1">
                <span className="text-gray-400 shrink-0">Catatan Kesehatan:</span>
                <span className="font-medium text-gray-800 text-right break-words">
                  {displayValue(viewingItem.healthNotes)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewingItem(null)}
              className="w-full rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
