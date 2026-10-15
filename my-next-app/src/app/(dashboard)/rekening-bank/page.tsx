"use client";

import * as React from "react";
import {
  Building,
  CreditCard,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Building2,
} from "lucide-react";

import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  BankAccountRecord,
} from "@/services/bankAccountService";

export interface BankAccountItem {
  id: string;
  bankName: string;
  branchName: string; // KCP
  accountNumber: string;
  accountHolder: string; // a.n.
  officeBranch: string; // Kantor Cabang
  status: "Aktif" | "Nonaktif";
}

function mapRecordToBankAccountItem(r: BankAccountRecord): BankAccountItem {
  return {
    id: r.id,
    bankName: r.bank_name,
    branchName: r.branch_name || "-",
    accountNumber: r.account_number,
    accountHolder: r.account_holder,
    officeBranch: r.office_branch || "Kantor Pusat Jakarta",
    status: r.is_active ? "Aktif" : "Nonaktif",
  };
}

export default function RekeningBankPage() {
  const [accounts, setAccounts] = React.useState<BankAccountItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form Fields
  const [formBankName, setFormBankName] = React.useState("");
  const [formBranchName, setFormBranchName] = React.useState("");
  const [formAccountNumber, setFormAccountNumber] = React.useState("");
  const [formAccountHolder, setFormAccountHolder] = React.useState("PT Al-Madinah Wisata Syariah");
  const [formOfficeBranch, setFormOfficeBranch] = React.useState("Kantor Pusat Jakarta");
  const [formIsActive, setFormIsActive] = React.useState<boolean>(true);

  // Toast
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadAccounts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getBankAccounts();
      setAccounts(records.map(mapRecordToBankAccountItem));
    } catch (err: unknown) {
      console.error("Gagal memuat rekening bank dari Supabase:", err);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (acc: BankAccountItem) => {
    navigator.clipboard.writeText(acc.accountNumber);
    setCopiedId(acc.id);
    showToast(`Nomor rekening ${acc.accountNumber} disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormBankName("Bank Mandiri");
    setFormBranchName("KCP Thamrin Jakarta");
    setFormAccountNumber("");
    setFormAccountHolder("PT Al-Madinah Wisata Syariah");
    setFormOfficeBranch("Kantor Pusat Jakarta");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BankAccountItem) => {
    setEditingId(item.id);
    setFormBankName(item.bankName);
    setFormBranchName(item.branchName);
    setFormAccountNumber(item.accountNumber);
    setFormAccountHolder(item.accountHolder);
    setFormOfficeBranch(item.officeBranch);
    setFormIsActive(item.status === "Aktif");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBankName.trim() || !formAccountNumber.trim()) return;

    try {
      const payload: Partial<BankAccountRecord> = {
        bank_name: formBankName.trim(),
        branch_name: formBranchName.trim(),
        account_number: formAccountNumber.trim(),
        account_holder: formAccountHolder.trim() || "PT Al-Madinah Wisata Syariah",
        office_branch: formOfficeBranch,
        is_active: formIsActive,
      };

      if (editingId) {
        await updateBankAccount(editingId, payload);
        showToast("Data rekening berhasil diperbarui di Supabase!");
      } else {
        await createBankAccount(payload);
        showToast("Rekening bank baru berhasil ditambahkan ke Supabase!");
      }
      await loadAccounts();
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error("Gagal menyimpan rekening:", err);
      showToast("Gagal menyimpan rekening ke database Supabase.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus rekening "${name}"?`)) {
      try {
        await deleteBankAccount(id);
        await loadAccounts();
        showToast("Rekening bank berhasil dihapus dari Supabase.");
      } catch (err: unknown) {
        console.error("Gagal menghapus rekening:", err);
        showToast("Gagal menghapus rekening dari Supabase.");
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-800 text-white px-4 py-3 text-xs font-medium shadow-lg animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section (Screenshot 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Building className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Rekening Bank Penampung
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar rekening bank resmi untuk setoran pendaftaran, cicilan, dan pelunasan paket jamaah.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Rekening</span>
        </button>
      </div>

      {/* Bank Account Cards Grid (Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                      {acc.bankName}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {acc.branchName}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                  {acc.status}
                </span>
              </div>

              {/* Account Number Box */}
              <div className="my-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nomor Rekening
                  </span>
                  <button
                    onClick={() => handleCopy(acc)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                  >
                    {copiedId === acc.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-base sm:text-lg font-bold tracking-wider text-slate-900">
                  {acc.accountNumber}
                </p>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  a.n. {acc.accountHolder}
                </p>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3 text-slate-400 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{acc.officeBranch}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(acc)}
                  title="Ubah Rekening"
                  className="p-1 hover:text-emerald-700 transition cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(acc.id, acc.bankName)}
                  title="Hapus Rekening"
                  className="p-1 hover:text-red-600 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Popup Tambah/Edit Rekening */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingId ? "Edit Rekening Bank" : "Tambah Rekening Bank Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Informasi rekening penampung setoran jamaah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NAMA BANK <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  placeholder="Contoh: Bank Mandiri atau Bank Syariah Indonesia"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  KANTOR CABANG PEMBANTU (KCP)
                </label>
                <input
                  type="text"
                  value={formBranchName}
                  onChange={(e) => setFormBranchName(e.target.value)}
                  placeholder="Contoh: KCP Kebon Sirih Jakarta"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NOMOR REKENING <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formAccountNumber}
                  onChange={(e) => setFormAccountNumber(e.target.value)}
                  placeholder="Contoh: 1230009876543"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  ATAS NAMA REKENING
                </label>
                <input
                  type="text"
                  value={formAccountHolder}
                  onChange={(e) => setFormAccountHolder(e.target.value)}
                  placeholder="PT Al-Madinah Wisata Syariah"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  KANTOR CABANG PENGELOLA
                </label>
                <select
                  value={formOfficeBranch}
                  onChange={(e) => setFormOfficeBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option>Kantor Pusat Jakarta</option>
                  <option>Cabang Bandung</option>
                  <option>Cabang Surabaya</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Rekening Aktif (Tersedia untuk pembayaran jamaah)
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {editingId ? "Simpan Perubahan" : "Tambah Rekening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
