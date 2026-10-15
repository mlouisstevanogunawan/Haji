"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, UserPlus, CheckCircle2, RefreshCw } from "lucide-react";
import { UsersTable } from "@/components/users/UsersTable";
import { UserProfile } from "@/types/database";

function UsersContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedRole, setSelectedRole] = React.useState<string>("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedRole && selectedRole !== "all") params.append("role", selectedRole);

      const res = await fetch(`/api/users?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRole]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Check if redirected from add user
  React.useEffect(() => {
    if (searchParams.get("created") === "true") {
      showToast("Pengguna baru berhasil dibuat dan ditambahkan ke sistem!");
    }
  }, [searchParams]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-800 text-white px-4 py-3 text-xs font-medium shadow-xl animate-fade-in border border-emerald-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section (Screenshot 1) */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengguna
        </h1>
        <p className="text-xs text-slate-500">
          Kelola akun login staf, agen mitra, muthawif, dan jamaah
        </p>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[260px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent"
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-medium text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent cursor-pointer"
            >
              <option value="all">Semua Role</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin_cabang">Admin Cabang</option>
              <option value="mitra_agen">Mitra Agen</option>
              <option value="muthawif">Muthawif</option>
              <option value="jamaah">Jamaah</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tambah Pengguna Button */}
        <div>
          <Link
            href="/users/add"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Pengguna</span>
          </Link>
        </div>
      </div>

      {/* Users Data Table */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        onRefresh={fetchUsers}
        onShowToast={showToast}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span>Memuat Pengguna...</span>
          </div>
        </div>
      }
    >
      <UsersContent />
    </React.Suspense>
  );
}
