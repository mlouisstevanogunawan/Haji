"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getAgentById, updateAgent } from "@/services/agentService";
import { getBranches, BranchRecord } from "@/services/branchService";

export default function EditAgenPage() {
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
  const [notFound, setNotFound] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [notice, setNotice] = React.useState<
    { kind: "error" | "success"; text: string } | null
  >(null);

  // Form Fields - Data Agen (hanya boleh diisi dari baris DB, default kosong)
  const [branch, setBranch] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [commission, setCommission] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [address, setAddress] = React.useState("");

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadData() {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setNotFound(false);
      setLoadError("");
      try {
        let branchList: BranchRecord[] = [];
        try {
          branchList = (await getBranches()) || [];
          setBranches(branchList);
        } catch (err) {
          console.error("Gagal memuat cabang:", err);
        }

        const agentData = await getAgentById(id);
        if (!agentData) {
          setNotFound(true);
          return;
        }

        setBranch(agentData.branch_id || "");
        setName(agentData.name || "");
        setPhone(agentData.phone || "");
        setEmail(agentData.email || "");
        setCommission(
          agentData.commission_rate != null
            ? (agentData.commission_rate * 100).toFixed(2)
            : ""
        );
        setIsActive(agentData.is_active ?? true);
        // Kolom `city` dipakai untuk menyimpan alamat/domisili agen.
        setAddress(agentData.city || "");
      } catch (err: unknown) {
        console.error("Gagal memuat data agen:", err);
        setLoadError((err as Error).message || "Gagal memuat data agen.");
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama Agen wajib diisi!");
      return;
    }
    if (notFound) {
      showToast("error", "Data agen tidak ditemukan, tidak dapat disimpan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedRate = parseFloat(commission);
      const payload: Parameters<typeof updateAgent>[1] = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        commission_rate: isNaN(parsedRate) ? 0 : parsedRate / 100,
        city: address.trim() || null,
        branch_id: branch || null,
        is_active: isActive,
      };

      await updateAgent(id, payload);

      showToast("success", "Perubahan data agen berhasil disimpan.");
      setTimeout(() => router.push("/agen"), 700);
    } catch (err: unknown) {
      console.error("Gagal memperbarui agen:", err);
      showToast(
        "error",
        `Gagal menyimpan perubahan: ${(err as Error).message}`
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
          <Link href="/agen" className="hover:text-gray-900 transition">
            Agen
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Edit Agen</h1>
        <p className="text-sm text-gray-500 mt-0.5">{name}</p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-sm text-gray-500">
          Memuat data agen...
        </div>
      ) : notFound ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <p className="text-sm font-medium text-gray-900">Data tidak ditemukan</p>
          {loadError && <p className="text-xs text-red-600">{loadError}</p>}
          <Link
            href="/agen"
            className="inline-flex rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm"
          >
            Kembali ke Daftar Agen
          </Link>
        </div>
      ) : (
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
          {/* Card: Data Agen */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Data Agen
            </h2>

            {/* Cabang */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isLoading}
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
                placeholder="Contoh: Hasan Basri"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            {/* Telepon / WhatsApp & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon/WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0811-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Contoh: agen@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>

            {/* Komisi (%) & Checkbox Aktif */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Komisi (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="7.50"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                  Aktif
                </label>
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <textarea
                rows={3}
                placeholder="Alamat lengkap domisili agen..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
              />
            </div>
          </div>

          {/* Tombol Simpan Perubahan & Batal */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <Link
              href="/agen"
              className="rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm inline-flex items-center justify-center"
            >
              Batal
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
