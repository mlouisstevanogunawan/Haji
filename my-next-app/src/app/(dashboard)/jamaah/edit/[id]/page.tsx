"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getJamaahList, updateJamaah, JamaahProfile } from "@/services/jamaahService";
import { getBranches, BranchRecord } from "@/services/branchService";
import { getAgents, AgentRow } from "@/services/agentService";

export default function EditJamaahPage() {
  const router = useRouter();
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [agents, setAgents] = React.useState<AgentRow[]>([]);

  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  // Penempatan — nilai awal kosong, diisi dari baris Supabase setelah dimuat.
  const [branch, setBranch] = React.useState("");
  const [agent, setAgent] = React.useState("");

  // Data Pribadi
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nik, setNik] = React.useState("");
  const [birthPlace, setBirthPlace] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [bloodType, setBloodType] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");

  // Paspor
  const [passportNumber, setPassportNumber] = React.useState("");
  const [passportIssuePlace, setPassportIssuePlace] = React.useState("");
  const [passportIssueDate, setPassportIssueDate] = React.useState("");
  const [passportExpiryDate, setPassportExpiryDate] = React.useState("");

  // Mahram & Kontak Darurat
  const [mahramName, setMahramName] = React.useState("");
  const [mahramRelation, setMahramRelation] = React.useState("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");

  // Kesehatan
  const [healthNotes, setHealthNotes] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [branchData, agentData] = await Promise.all([
          getBranches().catch(() => []),
          getAgents().catch(() => []),
        ]);
        if (branchData && branchData.length > 0) setBranches(branchData);
        if (agentData && agentData.length > 0) setAgents(agentData);

        if (id) {
          const list: JamaahProfile[] = await getJamaahList().catch(() => []);
          const found = list.find((item) => item.id === id);
          if (found) {
            setName(found.name || "");
            if (found.gender) setGender(found.gender);
            const val = (v?: string | null) => (v && v !== "-" ? v : "");
            setNik(val(found.nik));
            setPhone(val(found.phone));
            setEmail(found.email || "");
            setBirthPlace(val(found.birthPlace));
            setBirthDate(val(found.birthDate));
            setBloodType(val(found.bloodType));
            setCity(val(found.city));
            setAddress(val(found.address));
            setPassportNumber(val(found.passportNumber));
            setPassportIssuePlace(val(found.passportIssuePlace));
            setPassportIssueDate(val(found.passportIssueDate));
            setPassportExpiryDate(val(found.passportExpiry));
            setMahramName(val(found.mahramName));
            setMahramRelation(val(found.mahramRelation));
            setEmergencyContactName(val(found.emergencyContactName));
            setEmergencyContactPhone(val(found.emergencyContactPhone));
            setHealthNotes(val(found.healthNotes));
            // Select memakai id cabang & kode agen, jadi cocokkan dulu nama yang
            // dikembalikan getJamaahList() ke daftar yang baru dimuat. Bila tidak
            // ada barisnya, nilai tersimpan tetap dipakai supaya edit tidak
            // diam-diam mengosongkan cabang/agen (mapProfileFields melewati
            // nilai yang bukan uuid/kode tak dikenal).
            if (found.branch && found.branch !== "-") {
              const matchedBranch = branchData.find((b) => b.name === found.branch);
              setBranch(matchedBranch ? matchedBranch.id : found.branch);
            }
            if (found.agent && found.agent !== "Langsung") setAgent(found.agent);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data jamaah:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama Lengkap jamaah wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    if (!id || id.startsWith("jm-") || id.startsWith("local-")) {
      showToast("error", "Data contoh tidak dapat disimpan.");
      setIsSubmitting(false);
      return;
    }
    try {
      await updateJamaah(id, {
        name: name.trim(),
        gender,
        nik: nik.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        birthPlace: birthPlace.trim() || null,
        birthDate: birthDate || null,
        bloodType: bloodType.trim() || null,
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
        agent: agent || null,
        status: isActive ? "Aktif" : "Nonaktif",
      });
      showToast("success", "Perubahan data jamaah tersimpan di database.");
      setTimeout(() => router.push(`/jamaah/${id}`), 700);
    } catch (err: unknown) {
      console.error("Gagal menyimpan perubahan jamaah:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nilai tersimpan yang tidak punya baris cabang/agen di database tetap
  // ditampilkan sebagai opsi tambahan supaya tidak hilang dari tampilan.
  const orphanBranch =
    branch && !branches.some((b) => b.id === branch) ? branch : null;
  const orphanAgent =
    agent && !agents.some((a) => (a.code || a.id) === agent) ? agent : null;

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
          <span className="text-gray-900 font-medium">Edit</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Edit Jamaah</h1>
        <p className="text-sm text-gray-500 mt-0.5">{name || "—"}</p>
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
                {orphanBranch && <option value={orphanBranch}>{orphanBranch}</option>}
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
                {orphanAgent && <option value={orphanAgent}>{orphanAgent}</option>}
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad Fauzi"
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "Laki-laki" | "Perempuan")}
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
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="3201000000000001"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Jakarta"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
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
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>

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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081200000001"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jamaah@example.com"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kota
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Jakarta"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Contoh No. 1, Jakarta"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Paspor */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Paspor
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Paspor
                </label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="A1000000"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempat Penerbitan
                </label>
                <input
                  type="text"
                  value={passportIssuePlace}
                  onChange={(e) => setPassportIssuePlace(e.target.value)}
                  placeholder="Jakarta"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
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
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
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
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Mahram & Kontak Darurat */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Mahram &amp; Kontak Darurat
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Mahram
                </label>
                <input
                  type="text"
                  value={mahramName}
                  onChange={(e) => setMahramName(e.target.value)}
                  placeholder="-"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hubungan Mahram
                </label>
                <input
                  type="text"
                  value={mahramRelation}
                  onChange={(e) => setMahramRelation(e.target.value)}
                  placeholder="-"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
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
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Contoh: nama keluarga terdekat"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon Kontak Darurat
                </label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="081300000001"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Kesehatan */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Kesehatan
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan Kesehatan
              </label>
              <textarea
                rows={3}
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                placeholder="Riwayat penyakit, alergi, obat-obatan khusus"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Riwayat penyakit, alergi, obat-obatan khusus
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="activeStatus"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label
                htmlFor="activeStatus"
                className="text-sm font-medium text-gray-700 cursor-pointer select-none"
              >
                Aktif
              </label>
            </div>
          </div>
        </div>

        {/* Tombol Simpan Perubahan & Batal */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <Link
            href={id ? `/jamaah/${id}` : "/jamaah"}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer text-center"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
