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
  Calendar,
  KeyRound,
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
    agent: p.agent || "Langsung",
  };
}

export default function JamaahReferralPage() {
  const [jamaahList, setJamaahList] = React.useState<JamaahItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [isAdding, setIsAdding] = React.useState(false);

  // Form states matching Screenshot 3
  const [formBranch, setFormBranch] = React.useState("Cabang Bandung (CAB-BDG)");
  const [formAgent, setFormAgent] = React.useState("-- Tanpa Agen (Pendaftaran Langsung) --");

  const [formName, setFormName] = React.useState("");
  const [formGender, setFormGender] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [formNik, setFormNik] = React.useState("");
  const [formBirthPlace, setFormBirthPlace] = React.useState("");
  const [formBirthDate, setFormBirthDate] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formAddress, setFormAddress] = React.useState("");

  const [formPassport, setFormPassport] = React.useState("");
  const [formPassportExp, setFormPassportExp] = React.useState("");

  const [formMahram, setFormMahram] = React.useState("");
  const [formEmergencyName, setFormEmergencyName] = React.useState("");
  const [formEmergencyPhone, setFormEmergencyPhone] = React.useState("");

  const [formHealthNotes, setFormHealthNotes] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formCreateAccount, setFormCreateAccount] = React.useState(false);

  const loadJamaah = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getJamaahList();
      setJamaahList(data.map(mapProfileToItem));
    } catch (err: unknown) {
      console.error("Gagal memuat data referral jamaah:", err);
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
    return matchesSearch;
  });

  const handleCreateJamaah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formNik) return;

    try {
      await createJamaah({
        name: formName.trim(),
        gender: formGender,
        nik: formNik.trim(),
        phone: formPhone.trim() || "-",
        email: formEmail.trim() || undefined,
        passportNumber: formPassport.trim() || "-",
        passportExpiry: formPassportExp ? formPassportExp : "-",
        isPassportExpiringSoon: false,
        branch: formBranch.split(" (")[0],
        agent: formAgent.includes("Tanpa") ? "Langsung" : "Agen: Hasan Basri",
      });
      await loadJamaah();
      setIsAdding(false);
      setFormName("");
      setFormNik("");
      setFormPhone("");
      setFormEmail("");
    } catch (err) {
      console.error("Gagal membuat data jamaah referral:", err);
      alert("Gagal menyimpan data jamaah ke Supabase.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus data jamaah ini?")) {
      try {
        await deleteJamaah(id);
        await loadJamaah();
      } catch (err) {
        console.error("Gagal menghapus jamaah:", err);
      }
    }
  };

  // If in Add Mode, show EXACT form from Screenshot 3
  if (isAdding) {
    return (
      <div className="space-y-6 pb-16 max-w-4xl">
        <form onSubmit={handleCreateJamaah} className="space-y-5 text-xs">
          {/* Section 1: Penempatan Cabang & Referral */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2.5">
              Penempatan Cabang &amp; Referral
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  KANTOR CABANG <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option>Cabang Bandung (CAB-BDG)</option>
                    <option>Kantor Pusat Jakarta</option>
                    <option>Cabang Surabaya</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  AGEN / REFERRAL
                </label>
                <div className="relative">
                  <select
                    value={formAgent}
                    onChange={(e) => setFormAgent(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option>-- Tanpa Agen (Pendaftaran Langsung) --</option>
                    <option>Hasan Basri (AGN-001)</option>
                    <option>Ahmad Fauzi (AGN-002)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Data Pribadi Jamaah */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2.5">
              Data Pribadi Jamaah
            </h3>

            {/* Nama Lengkap */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                NAMA LENGKAP (SESUAI KTP &amp; PASPOR) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Muhammad Ilham"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Gender & NIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  JENIS KELAMIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NOMOR INDUK KEPENDUDUKAN (NIK) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNik}
                  onChange={(e) => setFormNik(e.target.value)}
                  placeholder="16 digit angka NIK KTP"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  TEMPAT LAHIR
                </label>
                <input
                  type="text"
                  value={formBirthPlace}
                  onChange={(e) => setFormBirthPlace(e.target.value)}
                  placeholder="Kota Kelahiran"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  TANGGAL LAHIR
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* No Telepon & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NOMOR TELEPON / WHATSAPP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  EMAIL JAMAAH
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="jamaah@example.com"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Alamat Domisili */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                ALAMAT DOMISILI LENGKAP
              </label>
              <textarea
                rows={2}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Alamat lengkap tempat tinggal saat ini..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
              />
            </div>
          </div>

          {/* Section 3: Dokumen Paspor RI */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2.5">
              Dokumen Paspor RI
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NOMOR PASPOR
                </label>
                <input
                  type="text"
                  value={formPassport}
                  onChange={(e) => setFormPassport(e.target.value)}
                  placeholder="Contoh: A 1234567"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  TANGGAL KADALUARSA PASPOR
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={formPassportExp}
                    onChange={(e) => setFormPassportExp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Minimal masa berlaku 6 bulan sebelum jadwal keberangkatan.
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Mahram & Kontak Darurat */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2.5">
              Mahram &amp; Kontak Darurat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  HUBUNGAN MAHRAM
                </label>
                <input
                  type="text"
                  value={formMahram}
                  onChange={(e) => setFormMahram(e.target.value)}
                  placeholder="Misal: Suami / Ayah / Saudara Kandung"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NAMA KONTAK DARURAT
                </label>
                <input
                  type="text"
                  value={formEmergencyName}
                  onChange={(e) => setFormEmergencyName(e.target.value)}
                  placeholder="Nama keluarga terdekat"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                NOMOR TELEPON KONTAK DARURAT
              </label>
              <input
                type="text"
                value={formEmergencyPhone}
                onChange={(e) => setFormEmergencyPhone(e.target.value)}
                placeholder="081234567..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 5: Kesehatan & Status Jamaah */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2.5">
              Kesehatan &amp; Status Jamaah
            </h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                CATATAN KHUSUS KESEHATAN (RIWAYAT PENYAKIT / ALERGI / KEBUTUHAN KURSI RODA)
              </label>
              <textarea
                rows={2}
                value={formHealthNotes}
                onChange={(e) => setFormHealthNotes(e.target.value)}
                placeholder="Contoh: Hipertensi, membutuhkan pendampingan kursi roda saat tawaf..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800 text-xs">
                  Status Jamaah Aktif
                </span>
              </label>
            </div>
          </div>

          {/* Section 6: Akses Portal Jamaah */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-emerald-700" />
              <span className="font-bold text-slate-800 text-xs">
                Akses Portal Jamaah
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formCreateAccount}
                onChange={(e) => setFormCreateAccount(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-600">Buatkan akun login</span>
            </label>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>Simpan Data Jamaah</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 text-xs font-semibold transition shadow-sm"
            >
              <span>Batal</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Default: Table view
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
          onClick={() => setIsAdding(true)}
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
              <option>Aktif</option>
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
                        title="Lihat Detail"
                        className="p-1 hover:text-slate-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
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
    </div>
  );
}
