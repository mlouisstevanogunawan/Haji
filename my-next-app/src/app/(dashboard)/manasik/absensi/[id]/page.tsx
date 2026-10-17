"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, User, UserX } from "lucide-react";
import {
  getManasikSessionById,
  getAttendanceBySession,
  ensureSessionAttendance,
  updateAttendanceStatus,
} from "@/services/manasikService";

interface AttendanceItem {
  id: string;
  name: string;
  status: "Hadir" | "Izin" | "Tidak Hadir";
}

function mapAttendanceStatus(
  status: string | undefined
): "Hadir" | "Izin" | "Tidak Hadir" {
  if (status === "Hadir") return "Hadir";
  if (status === "Izin") return "Izin";
  return "Tidak Hadir";
}

export default function AbsensiManasikPage() {
  const params = useParams();
  const router = useRouter();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [notFound, setNotFound] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Session info (terisi dari Supabase, "-" bila kolomnya kosong)
  const [sessionTitle, setSessionTitle] = React.useState("-");
  const [sessionDate, setSessionDate] = React.useState("-");
  const [paket, setPaket] = React.useState("-");
  const [pembimbing, setPembimbing] = React.useState("-");
  const [waktu, setWaktu] = React.useState("-");
  const [lokasi, setLokasi] = React.useState("-");

  // Attendance
  const [attendees, setAttendees] = React.useState<AttendanceItem[]>([]);


  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    if (!id) {
      setNotFound(true);
      setAttendees([]);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Muat sesi manasik yang benar-benar ada di Supabase
      const session = await getManasikSessionById(id);
      if (!session) {
        setNotFound(true);
        setAttendees([]);
        return;
      }
      setNotFound(false);
      setSessionTitle(session.title || "-");
      setPaket(session.package_name || "-");
      setPembimbing(session.muthawif_name || "-");
      setWaktu(session.session_time || "-");
      setLokasi(session.location || "-");
      try {
        const parsed = new Date(session.session_date);
        setSessionDate(
          Number.isNaN(parsed.getTime())
            ? session.session_date || "-"
            : parsed.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
        );
      } catch {
        setSessionDate(session.session_date || "-");
      }

      // 2. Muat daftar kehadiran; bila belum ada, buat dari data jamaah nyata
      let records = await getAttendanceBySession(id);
      if (!records || records.length === 0) {
        records = await ensureSessionAttendance(id);
      }
      setAttendees(
        (records || []).map((r) => ({
          id: r.id,
          name: r.pilgrim_name,
          status: mapAttendanceStatus(r.status),
        }))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memuat detail manasik:", err);
      setAttendees([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (
    attendeeId: string,
    newStatus: "Hadir" | "Izin" | "Tidak Hadir"
  ) => {
    setAttendees((prev) =>
      prev.map((item) =>
        item.id === attendeeId ? { ...item, status: newStatus } : item
      )
    );

    try {
      const dbStatus = newStatus === "Tidak Hadir" ? "Alpa" : newStatus;
      await updateAttendanceStatus(attendeeId, dbStatus as "Hadir" | "Izin" | "Alpa");
      await loadData();
    } catch (err: unknown) {
      console.error("Gagal menyimpan status kehadiran:", err);
      alert(`Gagal menyimpan absensi: ${(err as Error).message}`);
      await loadData();
    }
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      for (const att of attendees) {
        const dbStatus = att.status === "Tidak Hadir" ? "Alpa" : att.status;
        await updateAttendanceStatus(att.id, dbStatus as "Hadir" | "Izin" | "Alpa");
      }
      await loadData();
      alert("Absensi jamaah berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal menyimpan absensi:", err);
      alert(`Gagal menyimpan absensi: ${(err as Error).message}`);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const hadirCount = attendees.filter((a) => a.status === "Hadir").length;
  const izinCount = attendees.filter((a) => a.status === "Izin").length;
  const tidakHadirCount = attendees.filter((a) => a.status === "Tidak Hadir").length;

  if (!isLoading && notFound) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Data tidak ditemukan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sesi manasik dengan id <span className="font-mono">{id || "(kosong)"}</span> tidak
            ada di Supabase.
            {loadError ? ` Pesan error: ${loadError}` : ""}
          </p>
          <Link
            href="/manasik"
            className="inline-block mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            Kembali ke Manasik
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <Link href="/manasik" className="hover:text-gray-900 transition">
              Manasik
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">{sessionTitle}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">{sessionTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sessionDate}</p>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hadir */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-600 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Hadir</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{hadirCount}</div>
          </div>
        </div>

        {/* Izin */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Izin</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{izinCount}</div>
          </div>
        </div>

        {/* Tidak Hadir */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Tidak Hadir</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{tidakHadirCount}</div>
          </div>
        </div>
      </div>

      {/* Card Informasi Jadwal (full-width) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100">
          Informasi Jadwal
        </h2>
        <div className="divide-y divide-gray-100 text-sm">
          <div className="py-3 flex justify-between items-center">
            <span className="text-gray-500">Paket</span>
            <span className="text-gray-900 font-medium">{paket}</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-gray-500">Pembimbing</span>
            <span className="text-gray-900 font-medium">{pembimbing}</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-gray-500">Waktu</span>
            <span className="text-gray-900 font-medium">{waktu}</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-gray-500">Lokasi</span>
            <span className="text-gray-900 font-medium">{lokasi}</span>
          </div>
        </div>
      </div>

      {/* Card Absensi Jamaah (full-width) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 sm:px-6 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Absensi Jamaah</h2>
          {loadError && (
            <p className="text-xs text-red-600 mt-1">
              Gagal memuat/menyimpan absensi dari Supabase: {loadError}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KEHADIRAN
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-400">
                    Memuat data absensi dari Supabase...
                  </td>
                </tr>
              ) : attendees.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-400">
                    {loadError
                      ? "Belum ada data absensi; gagal memuat dari Supabase."
                      : "Belum ada jamaah terdaftar pada sesi ini di Supabase."}
                  </td>
                </tr>
              ) : (
                attendees.map((attendee) => (
                <tr key={attendee.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {attendee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={attendee.status}
                      onChange={(e) =>
                        handleStatusChange(
                          attendee.id,
                          e.target.value as "Hadir" | "Izin" | "Tidak Hadir"
                        )
                      }
                      className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Izin">Izin</option>
                      <option value="Tidak Hadir">Tidak Hadir</option>
                    </select>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveAttendance}
          disabled={isSaving}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Menyimpan..." : "Simpan Absensi"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/manasik")}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm cursor-pointer"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
