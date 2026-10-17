"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Edit2,
  Key,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  UserCheck,
} from "lucide-react";
import { RoleBadge, ROLE_CONFIGS_MAP } from "./RoleBadge";
import { BranchBadge } from "./BranchBadge";
import { UserProfile, UserRole } from "@/types/database";
import { getBranches, BranchRecord } from "@/services/branchService";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface UsersTableProps {
  users: UserProfile[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onShowToast: (msg: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  onRefresh,
  onShowToast,
}) => {
  // Daftar cabang dimuat dari tabel branches Supabase — tidak ada cabang karangan.
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);

  // Banner galat/berhasil inline (tidak memakai alert()).
  const [notice, setNotice] = React.useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  const showToast = React.useCallback((kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    getBranches()
      .then((rows) => {
        if (!cancelled) setBranches(rows || []);
      })
      .catch((err) => {
        console.error("Gagal memuat daftar cabang:", err);
        if (!cancelled) setBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Edit State
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = React.useState("");
  const [editRole, setEditRole] = React.useState<UserRole>("jamaah");
  const [editBranch, setEditBranch] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);

  // Reset Password State
  const [resetUser, setResetUser] = React.useState<UserProfile | null>(null);
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);
  const [hasCopied, setHasCopied] = React.useState(false);

  // Delete State
  const [deletingUser, setDeletingUser] = React.useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Helper: get initials
  const getInitials = (name: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper: format date
  const formatDateDisplay = (dateStr?: string): string => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, "d MMM yyyy", { locale: localeId });
    } catch {
      return dateStr;
    }
  };

  // Opsi cabang: nilai yang disimpan ke /api/users adalah nama cabang (branch_name),
  // jadi value memakai b.name. Cabang lama yang tidak lagi ada di tabel branches
  // tetap ditampilkan supaya edit tidak diam-diam mengosongkannya.
  const branchOptions = React.useMemo(() => {
    const opts = [
      { label: "— Pilih Cabang —", value: "" },
      ...branches.map((b) => ({ label: b.name, value: b.name })),
    ];
    if (editBranch && !branches.some((b) => b.name === editBranch)) {
      opts.push({ label: editBranch, value: editBranch });
    }
    return opts;
  }, [branches, editBranch]);

  // Open Edit
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.full_name || "");
    setEditRole(user.role || "jamaah");
    setEditBranch(user.branch_name || "");
    setEditPhone(user.phone || "");
    setEditIsActive(user.is_active ?? true);
    setNotice(null);
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          full_name: editFullName,
          role: editRole,
          branch_name: editBranch,
          phone: editPhone,
          is_active: editIsActive,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onShowToast(`Data pengguna ${editFullName} berhasil diperbarui.`);
        setEditingUser(null);
        if (onRefresh) onRefresh();
      } else {
        showToast("error", json.error || "Gagal memperbarui pengguna");
      }
    } catch (err: any) {
      showToast("error", err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Reset Password
  const handleOpenReset = (user: UserProfile) => {
    setResetUser(user);
    setGeneratedPassword(null);
    setHasCopied(false);
    setNotice(null);
  };

  // Execute Reset Password
  const handleExecuteReset = async () => {
    if (!resetUser) return;
    setIsResetting(true);

    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resetUser.id,
          email: resetUser.email,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setGeneratedPassword(json.temporaryPassword);
        onShowToast(`Kata sandi untuk ${resetUser.email} berhasil direset.`);
        if (onRefresh) onRefresh();
      } else {
        showToast("error", json.error || "Gagal mereset kata sandi");
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal mereset kata sandi");
    } finally {
      setIsResetting(false);
    }
  };

  // Copy Password
  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  // Delete User
  const handleExecuteDelete = async (permanent: boolean = false) => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/users?id=${deletingUser.id}&permanent=${permanent}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        onShowToast(
          permanent
            ? `Pengguna ${deletingUser.full_name} berhasil dihapus permanen.`
            : `Pengguna ${deletingUser.full_name} dinonaktifkan.`
        );
        setDeletingUser(null);
        if (onRefresh) onRefresh();
      } else {
        showToast("error", json.error || "Gagal menghapus pengguna");
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus pengguna");
    } finally {
      setIsDeleting(false);
    }
  };

  const noticeBanner = notice && (
    <div
      role="alert"
      className={`rounded-lg border px-3 py-2.5 text-xs font-medium ${
        notice.kind === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {notice.text}
    </div>
  );

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            {/* Table Header */}
            <thead className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 pl-5 pr-3">NAMA &amp; PROFIL</th>
                <th className="px-3 py-3.5">EMAIL AKUN</th>
                <th className="px-3 py-3.5 text-center">ROLE</th>
                <th className="px-3 py-3.5">CABANG</th>
                <th className="px-3 py-3.5 text-center">STATUS</th>
                <th className="px-3 py-3.5">TERDAFTAR</th>
                <th className="py-3.5 pl-3 pr-5 text-center">AKSI</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada pengguna yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleKey = (user.role || "jamaah").toLowerCase();
                  const roleConfig = ROLE_CONFIGS_MAP[roleKey] || ROLE_CONFIGS_MAP.jamaah;
                  const initials = getInitials(user.full_name);

                  return (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      {/* NAMA & PROFIL */}
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm"
                          >
                            {user.avatar_text || initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {user.phone || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL AKUN */}
                      <td className="px-3 py-3.5 text-xs text-slate-600 font-mono">
                        {user.email}
                      </td>

                      {/* ROLE */}
                      <td className="px-3 py-3.5 text-center">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* CABANG */}
                      <td className="px-3 py-3.5 text-xs">
                        <BranchBadge branchName={user.branch_name} />
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-3.5 text-center">
                        {user.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 border border-red-200">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* TERDAFTAR */}
                      <td className="px-3 py-3.5 text-xs text-slate-600">
                        {formatDateDisplay(user.created_at)}
                      </td>

                      {/* AKSI */}
                      <td className="py-3.5 pl-3 pr-5 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Pengguna"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => handleOpenReset(user)}
                            title="Reset Kata Sandi"
                            className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
                          >
                            <Key className="h-3.5 w-3.5 text-slate-500" />
                            <span>Reset</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setNotice(null);
                              setDeletingUser(user);
                            }}
                            title="Hapus / Nonaktifkan Pengguna"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition shadow-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: EDIT USER */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Data Pengguna"
        description="Perbarui informasi profil pengguna dan hak akses peran."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {noticeBanner}
          <Input
            label="Nama Lengkap *"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Alamat Email (Login)
            </label>
            <input
              type="text"
              value={editingUser?.email || ""}
              disabled
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Alamat email login tidak dapat diubah langsung.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Peran / Hak Akses *"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              options={[
                { label: "Super Admin", value: "super_admin" },
                { label: "Admin Cabang", value: "admin_cabang" },
                { label: "Mitra Agen", value: "mitra_agen" },
                { label: "Muthawif", value: "muthawif" },
                { label: "Jamaah", value: "jamaah" },
              ]}
            />

            <Select
              label="Kantor Cabang"
              value={editBranch}
              onChange={(e) => setEditBranch(e.target.value)}
              options={branchOptions}
            />
          </div>

          <Input
            label="Telepon / WhatsApp"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="081234567890"
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              id="edit-active-checkbox"
              type="checkbox"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="edit-active-checkbox"
              className="text-sm font-medium text-slate-700 cursor-pointer"
            >
              Akun Aktif (Dapat Login ke Sistem)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingUser(null)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmittingEdit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RESET PASSWORD */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        title="Reset Kata Sandi"
        description="Buat kata sandi sementara baru untuk akun pengguna ini."
        maxWidth="md"
      >
        <div className="space-y-4">
          {noticeBanner}
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              Kata sandi lama milik <strong>{resetUser?.email}</strong> akan
              langsung digantikan. Bagikan kata sandi baru ini kepada pengguna secara aman.
            </div>
          </div>

          {!generatedPassword ? (
            <div className="py-2 text-center">
              <p className="text-sm text-slate-600 mb-4">
                Apakah Anda yakin ingin membuat kata sandi acak baru untuk pengguna{" "}
                <span className="font-semibold text-slate-800">{resetUser?.full_name}</span>?
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setResetUser(null)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleExecuteReset}
                  isLoading={isResetting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Key className="mr-1.5 h-4 w-4" />
                  Buat Sandi Baru Sekarang
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase text-slate-700">
                Kata Sandi Sementara Baru:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 border border-slate-300 rounded-lg p-2.5 font-mono text-base font-bold text-slate-900 tracking-wider">
                  {generatedPassword}
                </div>
                <Button
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="gap-1.5"
                >
                  {hasCopied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-600" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Segera minta pengguna untuk memperbarui kata sandi setelah login pertama kali.
              </p>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setResetUser(null)}>Selesai</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Konfirmasi Hapus / Nonaktifkan"
        maxWidth="md"
      >
        <div className="space-y-4">
          {noticeBanner}
          <p className="text-sm text-slate-600">
            Pilih tindakan untuk akun pengguna{" "}
            <strong>{deletingUser?.full_name}</strong> ({deletingUser?.email}):
          </p>
          <div className="space-y-2 rounded-lg border border-slate-200 p-3 bg-slate-50 text-xs text-slate-600">
            <p>
              • <strong>Nonaktifkan (Rekomendasi):</strong> Pengguna tidak dapat login, namun riwayat log transaksi &amp; data lama tetap aman.
            </p>
            <p>
              • <strong>Hapus Permanen:</strong> Menghapus akun dari otentikasi Supabase dan tabel profil.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
            >
              Batal
            </Button>
            <Button
              variant="secondary"
              isLoading={isDeleting}
              onClick={() => handleExecuteDelete(false)}
            >
              Nonaktifkan Saja
            </Button>
            <Button
              variant="destructive"
              isLoading={isDeleting}
              onClick={() => handleExecuteDelete(true)}
            >
              Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
