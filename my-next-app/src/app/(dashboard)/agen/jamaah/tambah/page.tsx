"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createJamaah } from "@/services/jamaahService";
import { getBranches, BranchRecord } from "@/services/branchService";

export default function TambahJamaahAgenPage() {
  const router = useRouter();


  // Form states matching Screenshot 2
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [branchId, setBranchId] = React.useState("");

  // Data Pribadi
  const [namaLengkap, setNamaLengkap] = React.useState("");
  const [jenisKelamin, setJenisKelamin] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nik, setNik] = React.useState("");
  const [tempatLahir, setTempatLahir] = React.useState("");
  const [tanggalLahir, setTanggalLahir] = React.useState("");
  const [golonganDarah, setGolonganDarah] = React.useState("-");
  const [telepon, setTelepon] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [kota, setKota] = React.useState("");
  const [alamat, setAlamat] = React.useState("");

  // Paspor
  const [nomorPaspor, setNomorPaspor] = React.useState("");
  const [tempatPenerbitan, setTempatPenerbitan] = React.useState("");
  const [tanggalTerbit, setTanggalTerbit] = React.useState("");
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = React.useState("");

  // Mahram & Kontak Darurat
  const [namaMahram, setNamaMahram] = React.useState("");
  const [hubunganMahram, setHubunganMahram] = React.useState("");
  const [namaKontakDarurat, setNamaKontakDarurat] = React.useState("");
  const [teleponKontakDarurat, setTeleponKontakDarurat] = React.useState("");

  // Kesehatan
  const [catatanKesehatan, setCatatanKesehatan] = React.useState("");

  // Akun Login
  const [buatAkunLogin, setBuatAkunLogin] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getBranches()
      .then((rows) => {
        if (cancelled) return;
        setBranches(rows);
        const hq = rows.find((b) => b.is_headquarter) || rows[0];
        if (hq) setBranchId(hq.id);
      })
      .catch((err) => console.error("Gagal memuat cabang:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!namaLengkap.trim()) {
      setErrorMessage("Nama Lengkap wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      await createJamaah({
        name: namaLengkap.trim(),
        gender: jenisKelamin,
        nik: nik.trim() || null,
        phone: telepon.trim() || null,
        email: email.trim() || null,
        birthPlace: tempatLahir.trim() || null,
        birthDate: tanggalLahir || null,
        bloodType: golonganDarah === "-" ? null : golonganDarah,
        city: kota.trim() || null,
        address: alamat.trim() || null,
        passportNumber: nomorPaspor.trim() || null,
        passportIssuePlace: tempatPenerbitan.trim() || null,
        passportIssueDate: tanggalTerbit || null,
        passportExpiry: tanggalKadaluarsa || null,
        mahramName: namaMahram.trim() || null,
        mahramRelation: hubunganMahram.trim() || null,
        emergencyContactName: namaKontakDarurat.trim() || null,
        emergencyContactPhone: teleponKontakDarurat.trim() || null,
        healthNotes: catatanKesehatan.trim() || null,
        branchId: branchId || null,
        is_active: buatAkunLogin,
      });
      router.push("/agen/jamaah");
    } catch (err) {
      // Jangan berpura-pura berhasil: bila insert gagal, jamaah tidak tersimpan.
      console.error("Gagal menyimpan jamaah:", err);
      setErrorMessage(`Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/agen/dashboard" className="hover:text-gray-600 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/agen/jamaah" className="hover:text-gray-600 transition">
            Jamaah
          </Link>
          <span>&gt;</span>
          <span className="text-gray-500 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tambah Jamaah</h1>
      </div>

      {errorMessage && (
        <div className="max-w-xl p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Form cards stack on left side (~50-60% width) */}
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {/* Card 1: Penempatan */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Penempatan
          </h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cabang</label>
            <div className="relative">
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
              >
                <option value="">— Pilih Cabang —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Card 2: Data Pribadi */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Data Pribadi
          </h2>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={jenisKelamin}
                  onChange={(e) =>
                    setJenisKelamin(e.target.value as "Laki-laki" | "Perempuan")
                  }
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">NIK</label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Golongan Darah</label>
              <div className="relative">
                <select
                  value={golonganDarah}
                  onChange={(e) => setGolonganDarah(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
                >
                  <option value="-">-</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kota</label>
              <input
                type="text"
                value={kota}
                onChange={(e) => setKota(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              rows={3}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Card 3: Paspor */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Paspor
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nomor Paspor</label>
              <input
                type="text"
                value={nomorPaspor}
                onChange={(e) => setNomorPaspor(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tempat Penerbitan
              </label>
              <input
                type="text"
                value={tempatPenerbitan}
                onChange={(e) => setTempatPenerbitan(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Terbit</label>
              <input
                type="date"
                value={tanggalTerbit}
                onChange={(e) => setTanggalTerbit(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tanggal Kadaluarsa
              </label>
              <input
                type="date"
                value={tanggalKadaluarsa}
                onChange={(e) => setTanggalKadaluarsa(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Mahram & Kontak Darurat */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Mahram &amp; Kontak Darurat
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nama Mahram</label>
              <input
                type="text"
                value={namaMahram}
                onChange={(e) => setNamaMahram(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hubungan Mahram</label>
              <input
                type="text"
                value={hubunganMahram}
                onChange={(e) => setHubunganMahram(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nama Kontak Darurat
              </label>
              <input
                type="text"
                value={namaKontakDarurat}
                onChange={(e) => setNamaKontakDarurat(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Telepon Kontak Darurat
              </label>
              <input
                type="text"
                value={teleponKontakDarurat}
                onChange={(e) => setTeleponKontakDarurat(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Card 5: Kesehatan */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Kesehatan
          </h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Kesehatan</label>
            <textarea
              rows={3}
              value={catatanKesehatan}
              onChange={(e) => setCatatanKesehatan(e.target.value)}
              placeholder="Riwayat penyakit, alergi, obat-obatan khusus"
              className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Card 6: Akun Login */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Akun Login
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="buat-akun-login"
              checked={buatAkunLogin}
              onChange={(e) => setBuatAkunLogin(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label
              htmlFor="buat-akun-login"
              className="text-xs font-medium text-gray-700 cursor-pointer"
            >
              Buatkan akun login
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/agen/jamaah"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
