"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getPackageById } from "@/services/packageService";
import { getBookings, updateBooking } from "@/services/bookingService";

interface ManifestRowItem {
  id: string;
  name: string;
  regCode: string;
  roomNo: string;
  roomType: "Quad" | "Double" | "Single" | "Triple" | "";
  busNo: string;
  seatNo: string;
  mahramGroup: string;
}

/**
 * Tabel `bookings` belum punya kolom khusus manifest (kamar/bus/kursi/grup),
 * jadi penempatannya memakai kolom `notes` yang memang writable. Struktur JSON
 * ditandai `source: "manifest"` agar catatan lama jamaah tetap tersimpan.
 */
const MANIFEST_MARKER = "manifest";

type ManifestPayload = {
  source: typeof MANIFEST_MARKER;
  roomNo: string;
  roomType: string;
  busNo: string;
  seatNo: string;
  mahramGroup: string;
  originalNotes: string | null;
};

function parseManifestNotes(notes: string | null | undefined): ManifestPayload | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && parsed.source === MANIFEST_MARKER) return parsed as ManifestPayload;
  } catch {
    /* catatan bebas, bukan manifest */
  }
  return null;
}

export default function KelolaManifestPage() {
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

  const [packageName, setPackageName] = React.useState("-");
  const [packageCode, setPackageCode] = React.useState("-");
  const [rows, setRows] = React.useState<ManifestRowItem[]>([]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    if (!id) {
      setNotFound(true);
      setRows([]);
      setIsLoading(false);
      return;
    }

    try {
      const pkg = await getPackageById(id);
      if (!pkg) {
        setNotFound(true);
        setRows([]);
        return;
      }
      setNotFound(false);
      setPackageName(pkg.name || "-");
      // packages belum memiliki kolom code di Supabase
      setPackageCode(((pkg as typeof pkg & { code?: string | null }).code || "-"));

      const allBookings = await getBookings();
      const pkgBookings = (allBookings || []).filter((b) => b.package_id === pkg.id);
      setRows(
        pkgBookings.map((b) => {
          const stored = parseManifestNotes(b.notes);
          return {
            id: b.id,
            name: b.profiles?.full_name || "-",
            regCode: b.invoice_number || "-",
            roomNo: stored?.roomNo || "-",
            roomType: (stored?.roomType || "") as ManifestRowItem["roomType"],
            busNo: stored?.busNo || "-",
            seatNo: stored?.seatNo || "-",
            mahramGroup: stored?.mahramGroup || "-",
          };
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memuat manifest:", err);
      setRows([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFieldChange = (
    rowId: string,
    field: keyof ManifestRowItem,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    if (rows.length === 0) {
      alert("Tidak ada baris manifest yang dapat disimpan.");
      return;
    }

    setIsSaving(true);
    try {
      const allBookings = await getBookings();
      for (const row of rows) {
        const booking = allBookings.find((b) => b.id === row.id);
        const previous = booking?.notes;
        const originalNotes =
          parseManifestNotes(previous) === null ? previous ?? null : null;

        const payload: ManifestPayload = {
          source: MANIFEST_MARKER,
          roomNo: row.roomNo === "-" ? "" : row.roomNo,
          roomType: row.roomType,
          busNo: row.busNo === "-" ? "" : row.busNo,
          seatNo: row.seatNo === "-" ? "" : row.seatNo,
          mahramGroup: row.mahramGroup === "-" ? "" : row.mahramGroup,
          originalNotes,
        };

        await updateBooking(row.id, { notes: JSON.stringify(payload) });
      }
      await loadData();
      alert("Manifest rombongan berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal menyimpan manifest:", err);
      alert(`Gagal menyimpan manifest: ${(err as Error).message}`);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoading && notFound) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Data tidak ditemukan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paket/rombongan dengan id <span className="font-mono">{id || "(kosong)"}</span> tidak
            ada di Supabase.
            {loadError ? ` Pesan error: ${loadError}` : ""}
          </p>
          <Link
            href="/manifest"
            className="inline-block mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            Kembali ke Manifest
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section with Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/manifest" className="hover:text-gray-900 transition">
            Manifest
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{packageName}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">
          Manifest: {packageName}
        </h1>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{packageCode}</p>
      </div>

      {/* Card Table (full width) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NO. KAMAR
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  TIPE KAMAR
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NO. BUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NO. KURSI
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  GRUP MAHRAM
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    Memuat data manifest dari Supabase...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    {loadError
                      ? `Gagal memuat data manifest dari Supabase: ${loadError}`
                      : "Belum ada jamaah terdaftar pada rombongan ini di Supabase."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Jamaah */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{row.regCode}</div>
                  </td>

                  {/* No. Kamar */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={row.roomNo}
                      onChange={(e) =>
                        handleFieldChange(row.id, "roomNo", e.target.value)
                      }
                      className="w-24 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                    />
                  </td>

                  {/* Tipe Kamar */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.roomType}
                      onChange={(e) =>
                        handleFieldChange(
                          row.id,
                          "roomType",
                          e.target.value as ManifestRowItem["roomType"]
                        )
                      }
                      className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                    >
                      <option value="">Belum diatur</option>
                      <option value="Quad">Quad</option>
                      <option value="Triple">Triple</option>
                      <option value="Double">Double</option>
                      <option value="Single">Single</option>
                    </select>
                  </td>

                  {/* No. Bus */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={row.busNo}
                      onChange={(e) =>
                        handleFieldChange(row.id, "busNo", e.target.value)
                      }
                      className="w-28 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                    />
                  </td>

                  {/* No. Kursi */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={row.seatNo}
                      onChange={(e) =>
                        handleFieldChange(row.id, "seatNo", e.target.value)
                      }
                      className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                    />
                  </td>

                  {/* Grup Mahram */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={row.mahramGroup}
                      onChange={(e) =>
                        handleFieldChange(row.id, "mahramGroup", e.target.value)
                      }
                      className="w-28 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                    />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Menyimpan..." : "Simpan Manifest"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/manifest")}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm cursor-pointer"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
