"use client";

import * as React from "react";
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";

import {
  getJamaahList,
  createJamaah,
  updateJamaah,
  deleteJamaah,
  JamaahProfile,
} from "@/services/jamaahService";

export interface JamaahItem {
  id: string;
  code: string;
  name: string;
  gender: "Laki-laki" | "Perempuan";
  nik: string;
  phone: string;
  passportNumber: string;
  passportExpiry: string;
  isPassportExpiringSoon?: boolean;
  branch: string;
  agent: string;
  status?: string;
}

export default function DataJamaahPage() {
  const [jamaahList, setJamaahList] = React.useState<JamaahItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("Semua Status");

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewingItem, setViewingItem] = React.useState<JamaahItem | null>(null);

  // Form Fields
  const [formName, setFormName] = React.useState("");
  const [formGender, setFormGender] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [formNik, setFormNik] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [formPassport, setFormPassport] = React.useState("");
  const [formPassportExpiry, setFormPassportExpiry] = React.useState("");
  const [formBranch, setFormBranch] = React.useState("Kantor Pusat Jakarta");
  const [formAgent, setFormAgent] = React.useState("Langsung");

  // Toast
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getJamaahList();
      const mapped: JamaahItem[] = data.map((d) => ({
        id: d.id,
        code: d.code || `PLG-${d.id.slice(0, 8).toUpperCase()}`,
        name: d.name,
        gender: d.gender || "Laki-laki",
        nik: d.nik || "-",
        phone: d.phone || "-",
        passportNumber: d.passportNumber || "-",
        passportExpiry: d.passportExpiry || "-",
        isPassportExpiringSoon: d.isPassportExpiringSoon,
        branch: d.branch || "Kantor Pusat Jakarta",
        agent: d.agent || "Langsung",
        status: d.status || "Lunas",
      }));
      setJamaahList(mapped);
    } catch (err: any) {
      console.error("Failed to load jamaah data from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormGender("Laki-laki");
    setFormNik("");
    setFormPhone("");
    setFormPassport("");
    setFormPassportExpiry("Exp: Jun 2030");
    setFormBranch("Kantor Pusat Jakarta");
    setFormAgent("Langsung");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JamaahItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormGender(item.gender);
    setFormNik(item.nik);
    setFormPhone(item.phone);
    setFormPassport(item.passportNumber === "-" ? "" : item.passportNumber);
    setFormPassportExpiry(item.passportExpiry);
    setFormBranch(item.branch);
    setFormAgent(item.agent);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNik.trim()) return;

    const isExpSoon = formPassportExpiry.toLowerCase().includes("2026");

    try {
      if (editingId) {
        await updateJamaah(editingId, {
          name: formName.trim(),
          gender: formGender,
          nik: formNik.trim(),
          phone: formPhone.trim(),
          passportNumber: formPassport.trim() || "-",
          passportExpiry: formPassportExpiry.trim(),
          isPassportExpiringSoon: isExpSoon,
          branch: formBranch,
          agent: formAgent,
        });
        showToast("Data jamaah berhasil diperbarui di database!");
      } else {
        await createJamaah({
          name: formName.trim(),
          gender: formGender,
          nik: formNik.trim(),
          phone: formPhone.trim() || "081234567890",
          passportNumber: formPassport.trim() || "-",
          passportExpiry: formPassportExpiry.trim(),
          isPassportExpiringSoon: isExpSoon,
          branch: formBranch,
          agent: formAgent,
          status: "Lunas",
        });
        showToast("Jamaah baru berhasil disimpan ke database Supabase!");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data jamaah "${name}" dari database?`)) {
      try {
        await deleteJamaah(id);
        showToast("Data jamaah berhasil dihapus dari database.");
        await loadData();
      } catch (err: any) {
        showToast(`Gagal menghapus: ${err.message}`);
      }
    }
  };

  const filteredJamaah = jamaahList.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    return (
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.nik.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.passportNumber.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q)
    );
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

      {/* Header section (Screenshot 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Data Jamaah
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Master database jamaah Umroh &amp; Haji, rekam paspor, dan kontak darurat.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jamaah</span>
        </button>
      </div>

      {/* Filter / Search Bar (Screenshot 4) */}
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
            placeholder="Cari nama jamaah, NIK, nomor paspor, kode..."
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
              <option>Lunas</option>
              <option>DP</option>
              <option>Belum Bayar</option>
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

      {/* Table Data (Screenshot 4) */}
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
              {filteredJamaah.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  {/* Kode & Nama */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      {item.code}
                    </span>
                  </td>

                  {/* Gender */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    {item.gender === "Laki-laki" ? (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200/60">
                        Laki-laki
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200/60">
                        Perempuan
                      </span>
                    )}
                  </td>

                  {/* NIK */}
                  <td className="py-3.5 pr-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                    {item.nik}
                  </td>

                  {/* Kontak & WhatsApp */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span>{item.phone}</span>
                      <a
                        href={`https://wa.me/${item.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat WhatsApp"
                        className="text-emerald-500 hover:text-emerald-600 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5 fill-emerald-500/10" />
                      </a>
                    </div>
                  </td>

                  {/* Paspor & Kadaluarsa */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    {item.passportNumber === "-" ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <div>
                        <span className="font-mono font-medium text-slate-800">
                          {item.passportNumber}
                        </span>
                        {item.isPassportExpiringSoon ? (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600 border border-rose-200/60">
                              <AlertTriangle className="h-2.5 w-2.5 text-rose-500" />
                              <span>{item.passportExpiry}</span>
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.passportExpiry}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Cabang / Agen */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{item.branch}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.agent}</p>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 text-slate-400">
                      <button
                        onClick={() => setViewingItem(item)}
                        title="Lihat Detail"
                        className="p-1 hover:text-slate-700 transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Ubah Jamaah"
                        className="p-1 hover:text-emerald-700 transition cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        title="Hapus Jamaah"
                        className="p-1 hover:text-red-600 transition cursor-pointer"
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

      {/* Modal Tambah/Edit Jamaah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingId ? "Edit Data Jamaah" : "Tambah Jamaah Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Data identitas KTP, paspor, dan kontak jamaah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NAMA LENGKAP (SESUAI KTP/PASPOR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    JENIS KELAMIN
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NIK (16 DIGIT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    placeholder="Contoh: 3271012908339999"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NOMOR WHATSAPP / HP
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 081233445566"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    NOMOR PASPOR (JIKA ADA)
                  </label>
                  <input
                    type="text"
                    value={formPassport}
                    onChange={(e) => setFormPassport(e.target.value)}
                    placeholder="Contoh: E7788991"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    KADALUARSA PASPOR
                  </label>
                  <input
                    type="text"
                    value={formPassportExpiry}
                    onChange={(e) => setFormPassportExpiry(e.target.value)}
                    placeholder="Contoh: Exp: Jun 2030"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    KANTOR CABANG
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option>Kantor Pusat Jakarta</option>
                    <option>Cabang Bandung</option>
                    <option>Cabang Surabaya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  JALUR PENDAFTARAN / REFERRAL
                </label>
                <select
                  value={formAgent}
                  onChange={(e) => setFormAgent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option>Langsung</option>
                  <option>Agen: Ahmad Fauzi</option>
                </select>
              </div>

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
                  {editingId ? "Simpan Perubahan" : "Tambah Jamaah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Jamaah */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{viewingItem.name}</h3>
                <p className="text-[10px] font-mono text-slate-400">{viewingItem.code}</p>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Jenis Kelamin:</span>
                <span className="font-medium text-slate-700">{viewingItem.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">NIK (KTP):</span>
                <span className="font-mono font-medium text-slate-700">{viewingItem.nik}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">WhatsApp / HP:</span>
                <span className="font-medium text-slate-700">{viewingItem.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Nomor Paspor:</span>
                <span className="font-mono font-medium text-slate-700">{viewingItem.passportNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Masa Berlaku Paspor:</span>
                <span className="font-medium text-slate-700">{viewingItem.passportExpiry || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Kantor Cabang:</span>
                <span className="font-medium text-slate-700">{viewingItem.branch}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Pendaftaran:</span>
                <span className="font-medium text-slate-700">{viewingItem.agent}</span>
              </div>
            </div>

            <button
              onClick={() => setViewingItem(null)}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
