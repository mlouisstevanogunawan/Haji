"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getBranches, BranchRecord } from "@/services/branchService";

interface UserRow {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  branch_id?: string | null;
  phone?: string | null;
  is_active?: boolean | null;
}

export default function EditPenggunaSuperAdminPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";


  // Form states matching Screenshot 3
  const [nama, setNama] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRoleState] = React.useState("");
  const [branchId, setBranchId] = React.useState("");
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [telepon, setTelepon] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [kataSandi, setKataSandi] = React.useState("");
  const [loadedEmail, setLoadedEmail] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      setNotFound(false);
      setErrorMessage(null);
      try {
        const [res, gBranches] = await Promise.all([
          fetch(`/api/users`),
          getBranches().catch((err) => {
            console.error("Gagal memuat daftar cabang:", err);
            return [] as BranchRecord[];
          }),
        ]);
        setBranches(gBranches || []);

        if (!res.ok) {
          const failed = await res.json().catch(() => ({}));
          const pesan = failed?.error || `HTTP ${res.status}`;
          console.error("Gagal memuat pengguna:", pesan);
          setErrorMessage(`Gagal memuat data pengguna: ${pesan}`);
          return;
        }

        const json = await res.json();
        const found: UserRow | undefined = (json.data as UserRow[] | undefined)?.find(
          (u) => u.id === id
        );

        if (!found) {
          // Tidak ada record palsu: tampilkan keadaan error nyata.
          setNotFound(true);
          setErrorMessage(`Pengguna dengan ID "${id}" tidak ditemukan di database.`);
          return;
        }

        setNama(found.full_name || "");
        setEmail(found.email || "");
        setLoadedEmail((found.email || "").toLowerCase());
        setRoleState(
          found.role === "admin_cabang" || found.role === "super_admin"
            ? "Admin Cabang"
            : found.role === "mitra_agen" || found.role === "agen"
            ? "Agen / Marketing"
            : "Jamaah"
        );
        setBranchId(found.branch_id || "");
        setTelepon(found.phone || "");
        setIsActive(found.is_active !== false);
      } catch (err: unknown) {
        console.error("Gagal memuat pengguna:", err);
        setErrorMessage(`Gagal memuat data pengguna: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadUser();
    } else {
      setIsLoading(false);
      setNotFound(true);
      setErrorMessage("ID pengguna tidak valid.");
    }
  }, [id]);

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
    if (!role) {
      setErrorMessage("Role wajib dipilih.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          full_name: nama.trim(),
          email: email.trim().toLowerCase(),
          role:
            role === "Jamaah"
              ? "jamaah"
              : role === "Agen / Marketing" || role === "Agen/Marketing"
              ? "mitra_agen"
              : "admin_cabang",
          branch_id: branchId || null,
          phone: telepon.trim(),
          is_active: isActive,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        const pesan = json?.error || `HTTP ${res.status}`;
        console.error("Gagal menyimpan perubahan pengguna:", pesan);
        setErrorMessage(`Gagal menyimpan perubahan: ${pesan}`);
        return;
      }

      // Ganti kata sandi lewat endpoint reset password (service-role) bila diisi.
      if (kataSandi.trim()) {
        const pwRes = await fetch("/api/users/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: id,
            email: email.trim().toLowerCase(),
            manualPassword: kataSandi.trim(),
          }),
        });
        const pwJson = await pwRes.json().catch(() => ({}));
        if (!pwRes.ok || pwJson?.success === false) {
          setErrorMessage(
            `Data pengguna tersimpan, tapi kata sandi gagal diubah: ${
              pwJson?.error || `HTTP ${pwRes.status}`
            }`
          );
          return;
        }
        setKataSandi("");
      }

      // /api/users PUT tidak memperbarui kolom email, jadi perubahan email
      // harus diberitahukan supaya tidak kelihatan berhasil-berhasil saja.
      const catatanEmail =
        email.trim().toLowerCase() !== loadedEmail && loadedEmail
          ? " Catatan: perubahan email belum didukung endpoint /api/users."
          : "";

      alert(`Perubahan pengguna berhasil disimpan ke database.${catatanEmail}`);
      router.push("/super-admin/pengguna");
    } catch (err: unknown) {
      console.error("Gagal menyimpan perubahan pengguna:", err);
      setErrorMessage(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
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
          <span className="text-gray-500 font-medium">Edit</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Pengguna</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isLoading ? "Memuat data dari database..." : nama || "-"}
        </p>
      </div>

      {errorMessage && (
        <div className="max-w-xl p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {notFound && !isLoading && (
        <div className="max-w-xl bg-white border border-gray-200 rounded-lg p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Data tidak ditemukan</h2>
          <p className="text-sm text-gray-600">
            Pengguna dengan ID <span className="font-mono text-xs">{id}</span> tidak ada di
            tabel profiles pada Supabase.
          </p>
          <Link
            href="/super-admin/pengguna"
            className="inline-block bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition"
          >
            Kembali ke Daftar Pengguna
          </Link>
        </div>
      )}

      {/* Form Card (left aligned ~50-60% width) */}
      {!notFound && (
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
                  <option value="">-- Pilih Role --</option>
                  <option value="Admin Cabang">Admin Cabang</option>
                  <option value="Agen / Marketing">Agen / Marketing</option>
                  <option value="Jamaah">Jamaah</option>
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
                id="aktif-edit"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="aktif-edit" className="text-sm font-medium text-gray-700 cursor-pointer">
                Aktif
              </label>
            </div>
          </div>

          {/* Kata Sandi (Optional with hint) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              value={kataSandi}
              onChange={(e) => setKataSandi(e.target.value)}
              placeholder="Kosongkan jika tidak diubah"
              className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">Kosongkan jika tidak diubah</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <Link
            href="/super-admin/pengguna"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
          >
            Batal
          </Link>
        </div>
      </form>
      )}
    </div>
  );
}
