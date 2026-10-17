"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getBranches, BranchRecord } from "@/services/branchService";

const ROLE_TO_DB: Record<string, string> = {
  Jamaah: "jamaah",
  "Agen / Marketing": "mitra_agen",
  Muthawif: "muthawif",
  "Admin Cabang": "admin_cabang",
  "Super Admin": "super_admin",
};

export default function TambahPenggunaSuperAdminPage() {
  const router = useRouter();


  React.useEffect(() => {
    let cancelled = false;
    getBranches()
      .then((rows) => {
        if (!cancelled) setBranches(rows || []);
      })
      .catch((err) => console.error("Gagal memuat daftar cabang:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Form states matching Screenshot 2
  const [nama, setNama] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRoleState] = React.useState("");
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [branchId, setBranchId] = React.useState("");
  const [telepon, setTelepon] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [kataSandi, setKataSandi] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nama.trim()) {
      setErrorMessage("Nama wajib diisi.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Email tidak valid.");
      return;
    }
    if (!role || role === "— Pilih —") {
      setErrorMessage("Role wajib dipilih.");
      return;
    }
    if (!kataSandi || kataSandi.length < 8) {
      setErrorMessage("Kata sandi minimal 8 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const selectedBranch = branches.find((b) => b.id === branchId);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: nama.trim(),
          email: email.trim().toLowerCase(),
          role: ROLE_TO_DB[role],
          branch_id: branchId || null,
          branch_name: selectedBranch?.name || null,
          phone: telepon.trim(),
          password: kataSandi,
          is_active: isActive,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        // Jangan redirect bila insert gagal — akun tidak benar-benar tersimpan.
        setErrorMessage(`Gagal menyimpan pengguna ke database: ${json?.error || `HTTP ${res.status}`}`);
        return;
      }

      router.push("/super-admin/pengguna");
    } catch (err: unknown) {
      console.error("Gagal menambahkan pengguna:", err);
      setErrorMessage(`Gagal menyimpan pengguna ke database: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/dashboard" className="hover:text-gray-600 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/super-admin/pengguna" className="hover:text-gray-600 transition">
            Pengguna
          </Link>
          <span>&gt;</span>
          <span className="text-gray-500 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tambah Pengguna</h1>
      </div>

      {errorMessage && (
        <div className="max-w-xl p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Form Card (left aligned ~50-60% width) */}
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Data Pengguna
          </h2>

          {/* Nama * & Email * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
              />
            </div>
          </div>

          {/* Role * & Cabang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={role}
                  onChange={(e) => setRoleState(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition cursor-pointer"
                >
                  <option value="">— Pilih —</option>
                  <option value="Jamaah">Jamaah</option>
                  <option value="Agen / Marketing">Agen / Marketing</option>
                  <option value="Muthawif">Muthawif</option>
                  <option value="Admin Cabang">Admin Cabang</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <div className="relative">
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition cursor-pointer"
                >
                  <option value="">Tanpa Cabang</option>
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

          {/* Telepon / WhatsApp & Aktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
              />
            </div>

            <div className="flex items-center gap-2 sm:pt-5">
              <input
                type="checkbox"
                id="aktif"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="aktif" className="text-sm font-medium text-gray-700 cursor-pointer">
                Aktif
              </label>
            </div>
          </div>

          {/* Kata Sandi * */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kata Sandi <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={kataSandi}
              onChange={(e) => setKataSandi(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">Minimal 8 karakter</p>
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
            href="/super-admin/pengguna"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
