"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type RoleLabel = "Jamaah" | "Agen / Marketing" | "Admin Cabang" | "Super Admin" | "Muthawif";

interface UserAccount {
  id: string;
  nama: string;
  email: string;
  role: RoleLabel;
  cabang: string;
  status: "Aktif" | "Nonaktif";
  loginTerakhir: string;
}

function roleLabelFromDb(role: string | undefined): RoleLabel {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin_cabang":
      return "Admin Cabang";
    case "mitra_agen":
    case "agen":
      return "Agen / Marketing";
    case "muthawif":
      return "Muthawif";
    default:
      return "Jamaah";
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PenggunaSuperAdminPage() {
  const [users, setUsers] = React.useState<UserAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("Semua Role");
  const [activeFilterQuery, setActiveFilterQuery] = React.useState("");
  const [activeRoleFilter, setActiveRoleFilter] = React.useState("Semua Role");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null);
  const itemsPerPage = 15;


  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const rows: any[] = Array.isArray(json?.data) ? json.data : [];
      setUsers(
        rows.map((u) => ({
          id: u.id,
          nama: u.full_name || u.name || "Pengguna",
          email: u.email || "",
          role: roleLabelFromDb(u.role),
          cabang: u.branch_name || "-",
          status: u.is_active === false ? "Nonaktif" : "Aktif",
          loginTerakhir: formatDateTime(u.last_sign_in_at),
        }))
      );
    } catch (err: unknown) {
      const pesan = (err as Error).message;
      console.error("Gagal memuat daftar pengguna:", err);
      setUsers([]);
      setLoadError(`Gagal memuat daftar pengguna: ${pesan}`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilterQuery(searchInput.trim());
    setActiveRoleFilter(selectedRole);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter((u) => {
    const q = activeFilterQuery.toLowerCase();
    const matchQuery =
      !q || u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

    const matchRole =
      activeRoleFilter === "Semua Role" || u.role === activeRoleFilter;

    return matchQuery && matchRole;
  });

  const totalResults = filteredUsers.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (user: UserAccount) => {
    const hard = confirm(
      `Hapus permanen akun "${user.nama}" (${user.email}) dari database?` +
        "\n\nPilih Batal jika hanya ingin menonaktifkan akun."
    );
    if (!hard) {
      const deactivate = confirm(
        `Nonaktifkan akun "${user.nama}"? (status menjadi Nonaktif)`
      );
      if (!deactivate) return;
    }

    setBusyUserId(user.id);
    try {
      const res = await fetch(
        `/api/users?id=${encodeURIComponent(user.id)}&permanent=${hard}`,
        { method: "DELETE" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      showToast(
        hard
          ? `Pengguna ${user.nama} berhasil dihapus dari database.`
          : `Pengguna ${user.nama} dinonaktifkan.`
      );
      await loadUsers();
    } catch (err: unknown) {
      setLoadError(`Gagal menghapus pengguna: ${(err as Error).message}`);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResetPassword = async (user: UserAccount) => {
    if (!confirm(`Reset kata sandi ${user.email}?`)) return;
    setBusyUserId(user.id);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      showToast(
        `Kata sandi baru ${user.email}: ${json.temporaryPassword} (simpan sekarang)`
      );
    } catch (err: unknown) {
      setLoadError(`Gagal mereset kata sandi: ${(err as Error).message}`);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section with Breadcrumb & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/dashboard" className="hover:text-gray-600 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <span className="text-gray-500 font-medium">Pengguna</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akun login</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Muat Ulang
          </button>
          <Link
            href="/super-admin/pengguna/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pengguna</span>
          </Link>
        </div>
      </div>

      {(loadError || toastMessage) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            loadError
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {loadError ?? toastMessage}
        </div>
      )}

      {/* Search Bar + Filter Role + Tombol Cari */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] max-w-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama / email..."
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[160px]">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
          >
            <option value="Semua Role">Semua Role</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin Cabang">Admin Cabang</option>
            <option value="Agen / Marketing">Agen / Marketing</option>
            <option value="Muthawif">Muthawif</option>
            <option value="Jamaah">Jamaah</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <button
          type="submit"
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-2xs cursor-pointer"
        >
          Cari
        </button>
      </form>

      {/* Tabel Pengguna */}
      <div className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/80">
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  NAMA
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  ROLE
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  CABANG
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  LOGIN TERAKHIR
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    {loading
                      ? "Memuat data pengguna..."
                      : "Tidak ada data pengguna yang sesuai."}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/70 transition-colors border-b border-gray-100"
                  >
                    {/* Nama */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium text-gray-900">
                      {item.nama}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-normal">
                      {item.email}
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          item.role === "Super Admin"
                            ? "bg-indigo-50 text-indigo-700"
                            : item.role === "Admin Cabang"
                            ? "bg-blue-50 text-blue-700"
                            : item.role === "Agen / Marketing"
                            ? "bg-amber-50 text-amber-700"
                            : item.role === "Muthawif"
                            ? "bg-teal-50 text-teal-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {item.role}
                      </span>
                    </td>

                    {/* Cabang */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600">
                      {item.cabang}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          item.status === "Aktif"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Login Terakhir */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-normal">
                      {item.loginTerakhir}
                    </td>

                    {/* Kolom Aksi */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-3 text-xs">
                        <Link
                          href={`/super-admin/pengguna/edit/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(item)}
                          disabled={busyUserId === item.id}
                          className="text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer disabled:opacity-50"
                        >
                          Reset Sandi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={busyUserId === item.id}
                          className="text-rose-600 hover:text-rose-800 font-medium transition cursor-pointer disabled:opacity-50"
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

        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-gray-100 gap-3 text-xs text-gray-500 bg-white">
          <span>
            Showing {totalResults === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, totalResults)} of {totalResults} results
          </span>

          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCurrentPage(num)}
                className={`min-w-[28px] h-7 px-2 rounded-md font-medium text-xs transition cursor-pointer ${
                  currentPage === num
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
