"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getBankAccounts, updateBankAccount } from "@/services/bankAccountService";
import { getBranches, BranchRecord } from "@/services/branchService";

export default function EditRekeningBankPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);

  // Form Fields (hanya diisi dari baris DB, default kosong)
  const [branch, setBranch] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountHolder, setAccountHolder] = React.useState("");
  const [officeBranch, setOfficeBranch] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

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
        const [branchList, accounts] = await Promise.all([
          getBranches().catch((err) => {
            console.error("Gagal memuat cabang:", err);
            return [] as BranchRecord[];
          }),
          getBankAccounts().catch((err) => {
            console.error("Gagal memuat rekening:", err);
            return [] as Awaited<ReturnType<typeof getBankAccounts>>;
          }),
        ]);

        setBranches(branchList || []);

        const found = (accounts || []).find((a) => a.id === id);
        if (!found) {
          setNotFound(true);
          return;
        }
        setBankName(found.bank_name || "");
        setAccountNumber(found.account_number || "");
        setAccountHolder(found.account_holder || "");
        setOfficeBranch(found.office_branch || "");
        setBranch(found.branch_name || "");
        setIsActive(found.is_active ?? true);
      } catch (err: unknown) {
        console.error("Gagal memuat data rekening:", err);
        setLoadError((err as Error).message || "Gagal memuat data rekening.");
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notFound) {
      showToast("error", "Data rekening tidak ditemukan, tidak dapat disimpan.");
      return;
    }
    // bank_name, account_number, account_holder NOT NULL di bank_accounts.
    if (!bankName.trim()) {
      showToast("error", "Nama Bank wajib diisi!");
      return;
    }
    if (!accountNumber.trim()) {
      showToast("error", "No. Rekening wajib diisi!");
      return;
    }
    if (!accountHolder.trim()) {
      showToast("error", "Atas Nama rekening wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBankAccount(id, {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_holder: accountHolder.trim(),
        office_branch: officeBranch.trim() || null,
        // bank_accounts tidak punya kolom branch_id, jadi disimpan nama cabang terpilih.
        branch_name: branch.trim() || null,
        is_active: isActive,
      });
      showToast("success", "Perubahan data rekening berhasil disimpan ke database.");
      setTimeout(() => router.push("/rekening-bank"), 700);
    } catch (err: unknown) {
      console.error("Gagal memperbarui rekening:", err);
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
          <Link href="/rekening-bank" className="hover:text-gray-900 transition">
            Rekening Bank
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Edit Rekening Bank</h1>
        <p className="text-sm text-gray-500 mt-0.5">{bankName}</p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-sm text-gray-500">
          Memuat data rekening...
        </div>
      ) : notFound ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <p className="text-sm font-medium text-gray-900">Data tidak ditemukan</p>
          {loadError && <p className="text-xs text-red-600">{loadError}</p>}
          <Link
            href="/rekening-bank"
            className="inline-flex rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm"
          >
            Kembali ke Daftar Rekening
          </Link>
        </div>
      ) : (
        /* Card Form */
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
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
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
                <option value="">-- Pilih Cabang --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Bank & No. Rekening */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Muamalat"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 8009876543"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
            </div>

            {/* Atas Nama & Kantor Cabang Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atas Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Travel Umroh Haji"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kantor Cabang Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KCP Bandung"
                  value={officeBranch}
                  onChange={(e) => setOfficeBranch(e.target.value)}
                  disabled={isLoading}
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
              href="/rekening-bank"
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
