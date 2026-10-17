"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import {
  Plus,
  Calendar,
  UserCheck,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import {
  getManasikSessions,
  getAttendanceBySession,
  createManasikSession,
  deleteManasikSession,
  ensureSessionAttendance,
  updateAttendanceStatus,
  ManasikSessionRecord,
  ManasikAttendanceRecord,
} from "@/services/manasikService";
import { getPackages, PackageRow } from "@/services/packageService";
import { getGuides, GuideRow } from "@/services/guideService";
import { dbRead, dbUpdate } from "@/lib/db/write";

interface ManasikSessionItem {
  id: string;
  tanggal: string;
  judul: string;
  paket: string;
  paketId: string | null;
  pembimbing: string;
  pembimbingId: string | null;
  kehadiranHadir: number;
  kehadiranTotal: number;
  waktu?: string;
  lokasi?: string;
}

interface PilgrimAttendanceItem {
  id: string;
  name: string;
  nik: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpa";
}

function mapAttendance(records: ManasikAttendanceRecord[]): PilgrimAttendanceItem[] {
  return records.map((r) => ({
    id: r.id,
    name: r.pilgrim_name,
    nik: r.nik || "-",
    status: r.status === "Hadir" || r.status === "Izin" || r.status === "Sakit" || r.status === "Alpa"
      ? r.status
      : "Alpa",
  }));
}

export default function ManasikPage() {
  const { role, userId } = useRole();
  const pathname = usePathname();
  const isJamaah = role === "jamaah_umroh" || pathname.startsWith("/jamaah");
  const isMuthawif = role === "muthawif" || pathname.startsWith("/muthawif");

  const [sessions, setSessions] = React.useState<ManasikSessionItem[]>([]);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [guides, setGuides] = React.useState<GuideRow[]>([]);
  const [jamaahPackageIds, setJamaahPackageIds] = React.useState<string[]>([]);
  const [, setIsLoading] = React.useState(true);

  // Jamaah: jadwal manasik yang relevan adalah milik paket yang ia booking.
  React.useEffect(() => {
    if (!isJamaah) return;
    let cancelled = false;
    dbRead<{ package_id: string | null }>("bookings", {
      select: "package_id",
      eq: { pilgrim_id: userId },
    })
      .then((rows) => {
        if (!cancelled) {
          setJamaahPackageIds(
            Array.from(new Set(rows.map((r) => r.package_id).filter((id): id is string => Boolean(id))))
          );
        }
      })
      .catch((err) => console.error("Gagal memuat paket jamaah:", err));
    return () => {
      cancelled = true;
    };
  }, [isJamaah, userId]);

  // Muthawif: hanya sesi yang penugasan pembimbingnya menunjuk guide miliknya.
  const myGuideIds = React.useMemo(
    () =>
      isMuthawif
        ? guides
            .filter((g) => (g as { user_id?: string | null }).user_id === userId)
            .map((g) => g.id)
        : [],
    [isMuthawif, guides, userId]
  );

  const displayedSessions = isJamaah
    ? sessions.filter((s) => s.paketId && jamaahPackageIds.includes(s.paketId))
    : isMuthawif
    ? sessions.filter((s) => s.pembimbingId && myGuideIds.includes(s.pembimbingId))
    : sessions;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editSession, setEditSession] = React.useState<ManasikSessionItem | null>(null);
  const [activeAttendanceSession, setActiveAttendanceSession] =
    React.useState<ManasikSessionItem | null>(null);
  const [attendanceList, setAttendanceList] = React.useState<PilgrimAttendanceItem[]>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = React.useState(false);

  // Form New Session
  const [newJudul, setNewJudul] = React.useState("");
  const [newPaket, setNewPaket] = React.useState("");
  const [newTanggal, setNewTanggal] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [newPembimbing, setNewPembimbing] = React.useState("");
  const [newWaktu, setNewWaktu] = React.useState("");
  const [newLokasi, setNewLokasi] = React.useState("");

  const loadSessions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [records, allAttendance, pkgs, gds] = await Promise.all([
        getManasikSessions(),
        dbRead<{ session_id: string; status: string }>("manasik_attendance", {
          select: "session_id, status",
        }).catch(() => [] as { session_id: string; status: string }[]),
        getPackages().catch(() => []),
        getGuides().catch(() => []),
      ]);

      // Hitung kehadiran per sesi dari tabel manasik_attendance yang asli.
      const counts = new Map<string, { hadir: number; total: number }>();
      allAttendance.forEach((a) => {
        const prev = counts.get(a.session_id) || { hadir: 0, total: 0 };
        counts.set(a.session_id, {
          hadir: prev.hadir + (a.status === "Hadir" ? 1 : 0),
          total: prev.total + 1,
        });
      });

      const mapped: ManasikSessionItem[] = (records || []).map((r) => {
        let formattedDate = r.session_date;
        try {
          formattedDate = new Date(r.session_date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch {}
        return {
          id: r.id,
          tanggal: formattedDate,
          judul: r.title,
          paket: r.package_name || "-",
          paketId: r.package_id ?? null,
          pembimbing: r.muthawif_name || "-",
          pembimbingId: r.muthawif_id ?? null,
          kehadiranHadir: counts.get(r.id)?.hadir ?? 0,
          kehadiranTotal: counts.get(r.id)?.total ?? 0,
          waktu: r.session_time || "-",
          lokasi: r.location || "-",
        };
      });
      setSessions(mapped);
      setPackages(pkgs || []);
      setGuides(gds || []);
    } catch (err: unknown) {
      console.error("Gagal memuat manasik:", err);
      alert(`Gagal memuat jadwal manasik: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim() || !newPaket || !newLokasi.trim() || !newWaktu.trim()) {
      alert("Judul, paket, waktu, dan lokasi wajib diisi.");
      return;
    }

    const chosenPackage = packages.find((p) => p.name === newPaket);
    const chosenGuide = guides.find((g) => g.id === newPembimbing);

    try {
      await createManasikSession({
        title: newJudul,
        package_id: chosenPackage?.id ?? null,
        package_name: chosenPackage?.name ?? null,
        session_date: newTanggal,
        session_time: newWaktu,
        location: newLokasi,
        muthawif_id: chosenGuide?.id ?? null,
        muthawif_name: chosenGuide?.name ?? null,
      });
      setIsAddModalOpen(false);
      setNewJudul("");
      setNewWaktu("");
      setNewLokasi("");
      await loadSessions();
      alert("Jadwal manasik berhasil disimpan ke database.");
    } catch (err: unknown) {
      console.error("Gagal menambah jadwal manasik:", err);
      alert(`Gagal menyimpan jadwal manasik: ${(err as Error).message}`);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSession) return;

    try {
      await dbUpdate("manasik_sessions", editSession.id, {
        title: editSession.judul,
        package_name: editSession.paket,
        muthawif_name: editSession.pembimbing,
      });
      setEditSession(null);
      await loadSessions();
      alert("Perubahan jadwal manasik berhasil disimpan.");
    } catch (err: unknown) {
      console.error("Gagal memperbarui manasik:", err);
      alert(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus jadwal manasik ini?")) {
      try {
        await deleteManasikSession(id);
        await loadSessions();
        alert("Jadwal manasik berhasil dihapus.");
      } catch (err: unknown) {
        console.error("Gagal menghapus manasik:", err);
        alert(`Gagal menghapus jadwal manasik: ${(err as Error).message}`);
      }
    }
  };

  const handleOpenAttendance = async (session: ManasikSessionItem) => {
    setActiveAttendanceSession(session);
    setAttendanceList([]);
    setIsAttendanceLoading(true);
    try {
      // Ambil daftar hadir asli; bila sesi belum punya baris absensi sama sekali,
      // ensureSessionAttendance mengisinya dari tabel profiles lalu mengembalikan barisnya.
      let records = await getAttendanceBySession(session.id);
      if (records.length === 0) {
        records = await ensureSessionAttendance(session.id);
      }
      setAttendanceList(mapAttendance(records));
    } catch (err: unknown) {
      console.error("Gagal memuat daftar absensi:", err);
      alert(`Gagal memuat daftar absensi: ${(err as Error).message}`);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const handleToggleAttendance = (pilgrimId: string) => {
    setAttendanceList((prev) =>
      prev.map((p) => {
        if (p.id === pilgrimId) {
          const nextStatus =
            p.status === "Hadir" ? "Izin" : p.status === "Izin" ? "Alpa" : "Hadir";
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleSaveAttendance = async () => {
    if (!activeAttendanceSession) return;

    try {
      // Setiap perubahan status ditulis ke manasik_attendance, lalu tabel
      // di-load ulang dari database (bukan dihitung lokal).
      for (const item of attendanceList) {
        await updateAttendanceStatus(item.id, item.status);
      }
      setActiveAttendanceSession(null);
      await loadSessions();
      alert("Absensi jamaah berhasil disimpan ke database.");
    } catch (err: unknown) {
      console.error("Gagal menyimpan absensi:", err);
      alert(`Gagal menyimpan absensi: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Beranda</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Manasik</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Manasik</h1>
          <p className="text-sm text-gray-500">
            Jadwal bimbingan manasik &amp; absensi jamaah
          </p>
        </div>

        {/* Primary Button */}
        {!isMuthawif && !isJamaah && (
          <div>
            <Link
              href="/manasik/tambah"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Jadwal</span>
            </Link>
          </div>
        )}
      </div>

      {/* Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  TANGGAL
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JUDUL
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PAKET
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PEMBIMBING
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KEHADIRAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedSessions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Tanggal */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.tanggal}
                  </td>

                  {/* Judul */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.judul}
                  </td>

                  {/* Paket */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.paket}
                  </td>

                  {/* Pembimbing */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.pembimbing}
                  </td>

                  {/* Kehadiran */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.kehadiranHadir} / {item.kehadiranTotal}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isJamaah || isMuthawif ? (
                      <Link
                        href={`/manasik/absensi/${item.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                      >
                        Absensi
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/manasik/absensi/${item.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Absensi</span>
                        </Link>
                        <Link
                          href={`/manasik/edit/${item.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Jadwal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tambah Jadwal Manasik</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSession} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Judul Sesi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Manasik Umroh Reguler #1"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Paket <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newPaket}
                  onChange={(e) => setNewPaket(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">-- Pilih Paket --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.name}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={newTanggal}
                  onChange={(e) => setNewTanggal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Waktu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08:30 WIB"
                  value={newWaktu}
                  onChange={(e) => setNewWaktu(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Lokasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aula Kantor Pusat Jakarta"
                  value={newLokasi}
                  onChange={(e) => setNewLokasi(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Pembimbing / Muthawif</label>
                <select
                  value={newPembimbing}
                  onChange={(e) => setNewPembimbing(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">-- Belum ditentukan --</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Jadwal */}
      {editSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Jadwal Manasik</h3>
              <button
                onClick={() => setEditSession(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Judul Sesi</label>
                <input
                  type="text"
                  required
                  value={editSession.judul}
                  onChange={(e) =>
                    setEditSession({ ...editSession, judul: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Paket</label>
                <input
                  type="text"
                  value={editSession.paket}
                  onChange={(e) =>
                    setEditSession({ ...editSession, paket: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="text"
                  value={editSession.tanggal}
                  onChange={(e) =>
                    setEditSession({ ...editSession, tanggal: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Pembimbing</label>
                <input
                  type="text"
                  value={editSession.pembimbing}
                  onChange={(e) =>
                    setEditSession({ ...editSession, pembimbing: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditSession(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Absensi Jamaah */}
      {activeAttendanceSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Absensi Kehadiran Jamaah
                </h3>
                <p className="text-xs text-gray-500">
                  {activeAttendanceSession.judul} &bull; {activeAttendanceSession.tanggal}
                </p>
              </div>
              <button
                onClick={() => setActiveAttendanceSession(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-3">
                <span className="text-sm font-medium text-teal-900">
                  Total Jamaah Hadir
                </span>
                <span className="text-sm font-bold text-teal-800">
                  {attendanceList.filter((p) => p.status === "Hadir").length} /{" "}
                  {attendanceList.length} Jamaah
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {isAttendanceLoading && (
                  <p className="text-sm text-gray-500 py-2">Memuat daftar jamaah dari database...</p>
                )}
                {!isAttendanceLoading && attendanceList.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">
                    Belum ada data absensi tersimpan untuk sesi ini.
                  </p>
                )}
                {attendanceList.map((pilgrim) => (
                  <div
                    key={pilgrim.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pilgrim.name}</p>
                      <p className="text-xs text-gray-400">NIK: {pilgrim.nik}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(pilgrim.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                        pilgrim.status === "Hadir"
                          ? "bg-green-100 text-green-700"
                          : pilgrim.status === "Izin"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {pilgrim.status}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400">
                Klik tombol status pada setiap jamaah untuk mengubah kehadiran (Hadir &rarr; Izin &rarr; Alpa).
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveAttendanceSession(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
              >
                Simpan Absensi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
