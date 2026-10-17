"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGuide } from "@/services/guideService";
import { getBranches, BranchRecord } from "@/services/branchService";

export default function TambahMuthawifPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [notice, setNotice] = React.useState<
    { kind: "error" | "success"; text: string } | null
  >(null);

  // Form Fields - Data Muthawif / Pembimbing
  const [branch, setBranch] = React.useState("");
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [specialization, setSpecialization] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [bio, setBio] = React.useState("");

  // Form Fields - Akun Login
  const [createLoginAccount, setCreateLoginAccount] = React.useState(false);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadBranches() {
      try {
        const data = await getBranches();
        if (data && data.length > 0) {
          setBranches(data);
        }
      } catch (err) {
        console.error("Gagal memuat cabang:", err);
      }
    }
    loadBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama Muthawif wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      await createGuide({
        name: name.trim(),
        gender: gender || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        specialization: specialization.trim() || null,
        bio: bio.trim() || null,
        branch_id: branch || null,
        is_active: isActive,
      });

      showToast("success", "Muthawif baru berhasil disimpan ke database.");
      setTimeout(() => router.push("/muthawif"), 700);
    } catch (err: unknown) {
      console.error("Gagal menambahkan muthawif:", err);
      showToast(
        "error",
        `Gagal menyimpan ke Supabase: ${(err as Error).message}`
      );
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
          <Link href="/muthawif" className="hover:text-gray-900 transition">
            Muthawif
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Muthawif</h1>
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
        {/* Card 1: Data Muthawif / Pembimbing */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Data Muthawif / Pembimbing
          </h2>

          {/* Cabang */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cabang
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            >
              <option value="">— Tanpa Cabang —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Ustadz Abdullah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Jenis Kelamin & Telepon / WhatsApp */}
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
                Telepon / WhatsApp
              </label>
              <input
                type="text"
                placeholder="Contoh: 0811-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Email & Spesialisasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Contoh: muthawif@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spesialisasi
              </label>
              <input
                type="text"
                placeholder="Mis: Pembimbing Manasik, Penceramah"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Checkbox Aktif */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Aktif
            </label>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              placeholder="Profil singkat atau catatan muthawif..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>
        </div>

        {/* Card 2: Akun Login */}
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
              Buatkan akun login
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
            href="/muthawif"
            className="rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm inline-flex items-center justify-center"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
