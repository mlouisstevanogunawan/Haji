"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
} from "lucide-react";

import {
  getManasikSessions,
  createManasikSession,
  deleteManasikSession,
  ensureSessionAttendance,
  updateAttendanceStatus,
  ManasikSessionRecord,
  ManasikAttendanceRecord,
} from "@/services/manasikService";

interface ManasikSession {
  id: string;
  title: string;
  packageName: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  muthawif: string;
  hadirCount: number;
}

interface PilgrimAttendance {
  id: string;
  name: string;
  nik: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpa";
}

function mapRecordToSession(r: ManasikSessionRecord): ManasikSession {
  return {
    id: r.id,
    title: r.title,
    packageName: r.package_name || "Umroh Reguler",
    date: r.session_date,
    time: r.session_time,
    location: r.location,
    notes: r.notes || "Bimbingan Ibadah",
    muthawif: r.muthawif_name || "Ustadz Pembimbing",
    hadirCount: 0,
  };
}

export default function ManasikAbsensiPage() {
  const [sessions, setSessions] = React.useState<ManasikSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modal Attendance
  const [activeSessionForAbsen, setActiveSessionForAbsen] = React.useState<ManasikSession | null>(null);
  const [attendanceList, setAttendanceList] = React.useState<PilgrimAttendance[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(false);

  // Modal Add Session
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newPackage, setNewPackage] = React.useState("Umroh Reguler Syawal 1447H (9 Hari)");
  const [newDate, setNewDate] = React.useState("22 Okt 2026");
  const [newTime, setNewTime] = React.useState("08:30 WIB");
  const [newLocation, setNewLocation] = React.useState("Grand Ballroom Hotel Aston Jakarta");

  const loadSessions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getManasikSessions();
      setSessions(records.map(mapRecordToSession));
    } catch (err: unknown) {
      console.error("Gagal memuat manasik sessions:", err);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filteredSessions = sessions.filter((s) => {
    return (
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.packageName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenAttendance = async (session: ManasikSession) => {
    setActiveSessionForAbsen(session);
    setIsLoadingAttendance(true);
    try {
      const atts = await ensureSessionAttendance(session.id);
      setAttendanceList(
        atts.map((a) => ({
          id: a.id,
          name: a.pilgrim_name,
          nik: a.nik || "-",
          status: a.status,
        }))
      );
    } catch (err) {
      console.error("Gagal memuat presensi manasik:", err);
      setAttendanceList([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleUpdateStatus = async (attendanceId: string, newStatus: "Hadir" | "Izin" | "Sakit" | "Alpa") => {
    // optimistic update
    setAttendanceList((prev) =>
      prev.map((p) => (p.id === attendanceId ? { ...p, status: newStatus } : p))
    );
    try {
      await updateAttendanceStatus(attendanceId, newStatus);
    } catch (err) {
      console.error("Gagal memperbarui status presensi di database:", err);
    }
  };

  const handleSaveAttendance = () => {
    if (!activeSessionForAbsen) return;
    const hadirTotal = attendanceList.filter((p) => p.status === "Hadir").length;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionForAbsen.id ? { ...s, hadirCount: hadirTotal } : s
      )
    );
    setActiveSessionForAbsen(null);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      await createManasikSession({
        title: newTitle,
        package_name: newPackage,
        session_date: newDate,
        session_time: newTime,
        location: newLocation,
        notes: "Sesi Pembekalan Praktik",
        muthawif_name: "Ustadz Abdullah",
      });
      await loadSessions();
      setShowAddModal(false);
      setNewTitle("");
    } catch (err) {
      console.error("Gagal membuat jadwal manasik di database:", err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm("Hapus jadwal manasik ini?")) {
      try {
        await deleteManasikSession(id);
        await loadSessions();
      } catch (err) {
        console.error("Gagal menghapus jadwal manasik:", err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Jadwal Bimbingan Manasik
            </h1>
            <p className="text-xs text-slate-400">
              Penjadwalan sesi bimbingan ibadah Umroh/Haji, muthawif pembimbing, dan presensi jamaah.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul sesi manasik, lokasi pertemuan..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <button className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 px-4 py-1.5 text-xs font-semibold transition">
          Cari
        </button>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">SESI &amp; PAKET TERKAIT</th>
                <th className="pb-3.5 font-bold">TANGGAL &amp; WAKTU</th>
                <th className="pb-3.5 font-bold">LOKASI PERTEMUAN</th>
                <th className="pb-3.5 font-bold">PEMBIMBING (MUTHAWIF)</th>
                <th className="pb-3.5 font-bold">KEHADIRAN</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/70 transition">
                  {/* Sesi & Paket */}
                  <td className="py-3.5 pr-4 max-w-xs">
                    <p className="font-semibold text-slate-900">{session.title}</p>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60 mt-1">
                      {session.packageName}
                    </span>
                  </td>

                  {/* Tanggal & Waktu */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{session.time}</span>
                    </div>
                  </td>

                  {/* Lokasi Pertemuan */}
                  <td className="py-3.5 pr-4 max-w-xs">
                    <div className="flex items-start gap-1.5 text-slate-800">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{session.location}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 ml-5 mt-0.5">
                      {session.notes}
                    </p>
                  </td>

                  {/* Pembimbing */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{session.muthawif}</p>
                    <p className="text-[10px] text-slate-400">-</p>
                  </td>

                  {/* Kehadiran */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                      {session.hadirCount} Hadir
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAttendance(session)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-semibold transition shadow-sm active:scale-95"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Absensi</span>
                      </button>

                      <button
                        title="Edit Sesi"
                        className="p-1 text-slate-400 hover:text-slate-700 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        title="Hapus Sesi"
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Absensi Jamaah (100% Fungsional) */}
      {activeSessionForAbsen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Presensi Kehadiran Jamaah
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeSessionForAbsen.title} ({activeSessionForAbsen.date})
                </p>
              </div>
              <button
                onClick={() => setActiveSessionForAbsen(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of Pilgrims with status toggle */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {attendanceList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="font-mono text-[10px] text-slate-400">{p.nik}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(["Hadir", "Izin", "Sakit", "Alpa"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(p.id, st)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                          p.status === st
                            ? st === "Hadir"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : st === "Izin"
                              ? "bg-amber-500 text-white shadow-sm"
                              : st === "Sakit"
                              ? "bg-blue-500 text-white shadow-sm"
                              : "bg-red-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Total Hadir:{" "}
                <strong className="text-emerald-700">
                  {attendanceList.filter((p) => p.status === "Hadir").length} / {attendanceList.length}
                </strong>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSessionForAbsen(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Simpan Presensi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Jadwal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Sesi Manasik Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Judul Sesi Manasik
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Pemantapan Rukun Haji & Thawaf Wada"
                  className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Paket Keberangkatan Terkait
                </label>
                <select
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none"
                >
                  <option>Umroh Reguler Syawal 1447H (9 Hari)</option>
                  <option>Umroh Ramadhan Berkah I'tikaf 12 Hari</option>
                  <option>Haji Khusus Furoda VIP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Lokasi Pertemuan
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
