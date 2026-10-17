"use client";

import * as React from "react";
import {
  Plus,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

import {
  getBankAccounts,
  deleteBankAccount,
  BankAccountRecord,
} from "@/services/bankAccountService";

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  officeBranch: string;
  branchName: string;
  isActive: boolean;
}

function mapRecordToBankAccountItem(r: BankAccountRecord): BankAccountItem {
  return {
    id: r.id,
    bankName: r.bank_name,
    accountNumber: r.account_number,
    accountHolder: r.account_holder,
    officeBranch: r.office_branch ?? "",
    branchName: r.branch_name ?? "",
    isActive: r.is_active !== false,
  };
}

export default function RekeningBankPage() {
  const [accounts, setAccounts] = React.useState<BankAccountItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");

  // Toast
  const [toast, setToast] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  const loadAccounts = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const records = await getBankAccounts();
      setAccounts((records || []).map(mapRecordToBankAccountItem));
    } catch (err: unknown) {
      console.error("Gagal memuat rekening bank dari Supabase:", err);
      setAccounts([]);
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const showToast = (kind: "error" | "success", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus rekening "${name}"?`)) {
      try {
        await deleteBankAccount(id);
        await loadAccounts();
        showToast("success", "Rekening bank berhasil dihapus.");
      } catch (err: unknown) {
        console.error("Gagal menghapus rekening bank:", err);
        showToast("error", `Gagal menghapus rekening bank: ${(err as Error).message}`);
      }
    }
  };

  const filteredAccounts = accounts.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    return (
      !q ||
      item.bankName.toLowerCase().includes(q) ||
      item.accountNumber.toLowerCase().includes(q) ||
      item.accountHolder.toLowerCase().includes(q) ||
      item.officeBranch.toLowerCase().includes(q) ||
      item.branchName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium shadow-lg animate-fade-in ${
            toast.kind === "error"
              ? "bg-red-600 text-white"
              : "bg-teal-800 text-white"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-teal-300" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">
            <Link href="/dashboard" className="hover:text-gray-600 transition">
              Beranda
            </Link>{" "}
            &gt; <span className="text-gray-600">Rekening Bank</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Rekening Bank
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Daftar rekening bank penerimaan pembayaran
          </p>
        </div>

        <Link
          href="/rekening-bank/tambah"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-2.5 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Rekening</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-xs flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setAppliedSearch(searchQuery);
          }}
          placeholder="Cari nama bank..."
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />

        <button
          onClick={() => setAppliedSearch(searchQuery)}
          className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-xs font-medium transition cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Table Data (Matching Screenshot 5) */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-6">BANK</th>
                <th className="py-3 px-6">NO. REKENING</th>
                <th className="py-3 px-6">ATAS NAMA</th>
                <th className="py-3 px-6">CABANG</th>
                <th className="py-3 px-6">STATUS</th>
                <th className="py-3 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    Memuat data rekening dari Supabase...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-red-500 text-xs">
                    Gagal memuat rekening dari Supabase: {loadError}
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    {accounts.length === 0
                      ? "Belum ada rekening bank tersimpan di Supabase."
                      : "Tidak ada rekening bank yang sesuai dengan pencarian."}
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition">
                    {/* Bank */}
                    <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                      {item.bankName}
                    </td>

                    {/* No. Rekening */}
                    <td className="py-4 px-6 text-gray-600 font-mono whitespace-nowrap">
                      {item.accountNumber}
                    </td>

                    {/* Atas Nama */}
                    <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                      {item.accountHolder}
                    </td>

                    {/* Cabang */}
                    <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                      {item.officeBranch || item.branchName || (
                        <span className="text-gray-400">Belum diisi</span>
                      )}
                      {item.branchName && item.officeBranch && (
                        <span className="block text-[10px] text-gray-400">
                          Cabang: {item.branchName}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          item.isActive
                            ? "bg-teal-50 text-teal-700 border-teal-200/60"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/rekening-bank/edit/${item.id}`}
                          className="text-teal-600 hover:text-teal-700 font-medium transition cursor-pointer"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.bankName)}
                          className="text-red-500 hover:text-red-600 font-medium transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
