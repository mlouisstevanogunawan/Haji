"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createJamaah } from "@/services/jamaahService";
import { getBranches, BranchRecord } from "@/services/branchService";
import { getAgents, AgentRow } from "@/services/agentService";

export default function TambahJamaahPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [agents, setAgents] = React.useState<AgentRow[]>([]);
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  // Card 1: Penempatan
  const [branch, setBranch] = React.useState("");
  const [agent, setAgent] = React.useState("");

  // Card 2: Data Pribadi
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nik, setNik] = React.useState("");
  const [birthPlace, setBirthPlace] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [bloodType, setBloodType] = React.useState("Pilih Golongan Darah");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");

  // Card 3: Paspor
  const [passportNumber, setPassportNumber] = React.useState("");
  const [passportIssuePlace, setPassportIssuePlace] = React.useState("");
  const [passportIssueDate, setPassportIssueDate] = React.useState("");
  const [passportExpiryDate, setPassportExpiryDate] = React.useState("");

  // Card 4: Mahram & Kontak Darurat
  const [mahramName, setMahramName] = React.useState("");
  const [mahramRelation, setMahramRelation] = React.useState("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");

  // Card 5: Kesehatan
  const [healthNotes, setHealthNotes] = React.useState("");

  // Card 6: Akun Login
  const [createLoginAccount, setCreateLoginAccount] = React.useState(false);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadData() {
      try {
        const branchData = await getBranches();
        if (branchData && branchData.length > 0) {
          setBranches(branchData);
        }
      } catch (err) {
        console.error("Gagal memuat cabang:", err);
      }

      try {
        const agentData = await getAgents();
        if (agentData && agentData.length > 0) {
          setAgents(agentData);
        }
      } catch (err) {
        console.error("Gagal memuat agen:", err);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama Lengkap jamaah wajib diisi!");
      return;
    }
    if (!phone.trim()) {
      showToast("error", "Nomor telepon wajib diisi sebagai kontak utama jamaah.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAgent = agents.find((a) => (a.code || a.id) === agent);
      await createJamaah({
        name: name.trim(),
        gender,
        nik: nik.trim() || null,
        phone: phone.trim(),
        email: email.trim() || null,
        birthPlace: birthPlace.trim() || null,
        birthDate: birthDate || null,
        bloodType: bloodType === "Pilih Golongan Darah" ? null : bloodType,
        city: city.trim() || null,
        address: address.trim() || null,
        passportNumber: passportNumber.trim() || null,
        passportIssuePlace: passportIssuePlace.trim() || null,
        passportIssueDate: passportIssueDate || null,
        passportExpiry: passportExpiryDate || null,
        mahramName: mahramName.trim() || null,
        mahramRelation: mahramRelation.trim() || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
        healthNotes: healthNotes.trim() || null,
        branchId: branch || null,
        agent: selectedAgent?.code || null,
        is_active: createLoginAccount,
      });

      showToast("success", "Jamaah baru berhasil disimpan ke database.");
      setTimeout(() => router.push("/jamaah"), 700);
    } catch (err: unknown) {
      console.error("Gagal menambahkan jamaah:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      {/* Header section with Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/jamaah" className="hover:text-gray-900 transition">
            Jamaah
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Jamaah</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pendaftaran jamaah baru</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {notice && (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm ${
              notice.kind === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {notice.text}
          </div>
        )}
        {/* Card 1: Penempatan */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Penempatan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">— Pilih Cabang —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agen / Referral
              </label>
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">— Tanpa Agen —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.code || a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Data Pribadi */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Data Pribadi
          </h2>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Ahmad Fauzi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Jenis Kelamin & NIK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "Laki-laki" | "Perempuan")
                }
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIK
              </label>
              <input
                type="text"
                placeholder="Nomor Induk Kependudukan (16 digit)"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Tempat & Tanggal Lahir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                placeholder="Kota Lahir"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Golongan Darah & Telepon / WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Golongan Darah
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="Pilih Golongan Darah">Pilih Golongan Darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telepon / WhatsApp
              </label>
              <input
                type="text"
                placeholder="Contoh: 081200000001"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Email & Kota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Contoh: jamaah@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kota
              </label>
              <input
                type="text"
                placeholder="Kota domisili"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              rows={3}
              placeholder="Alamat lengkap domisili jamaah..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>
        </div>

        {/* Card 3: Paspor */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Paspor
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Paspor
              </label>
              <input
                type="text"
                placeholder="Contoh: A1000000"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempat Penerbitan
              </label>
              <input
                type="text"
                placeholder="Contoh: Jakarta"
                value={passportIssuePlace}
                onChange={(e) => setPassportIssuePlace(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Terbit
              </label>
              <input
                type="date"
                value={passportIssueDate}
                onChange={(e) => setPassportIssueDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Kadaluarsa
              </label>
              <input
                type="date"
                value={passportExpiryDate}
                onChange={(e) => setPassportExpiryDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Mahram & Kontak Darurat */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Mahram &amp; Kontak Darurat
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Mahram
              </label>
              <input
                type="text"
                placeholder="Nama mahram (jika ada)"
                value={mahramName}
                onChange={(e) => setMahramName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hubungan Mahram
              </label>
              <input
                type="text"
                placeholder="Mis: Suami, Ayah, Anak"
                value={mahramRelation}
                onChange={(e) => setMahramRelation(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kontak Darurat
              </label>
              <input
                type="text"
                placeholder="Nama keluarga terdekat"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telepon Kontak Darurat
              </label>
              <input
                type="text"
                placeholder="Nomor kontak darurat"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Card 5: Kesehatan */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Kesehatan
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan Kesehatan
            </label>
            <textarea
              rows={3}
              placeholder="Riwayat penyakit, alergi, obat-obatan khusus..."
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>
        </div>

        {/* Card 6: Akun Login */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Akun Login
          </h2>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="createLoginAccount"
              checked={createLoginAccount}
              onChange={(e) => setCreateLoginAccount(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label
              htmlFor="createLoginAccount"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Buatkan akun login (aktif)
            </label>
          </div>
        </div>

        {/* Tombol Simpan & Batal */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/jamaah"
            className="rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm inline-flex items-center justify-center"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
