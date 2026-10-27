"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getBookingById, updateBooking } from "@/services/bookingService";
import { getGuides, getGuideById, GuideRow } from "@/services/guideService";

export default function EditPendaftaranPage() {
  const router = useRouter();
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [guides, setGuides] = React.useState<GuideRow[]>([]);

  // Display metadata
  const [code, setCode] = React.useState("—");
  const [jamaahName, setJamaahName] = React.useState("Memuat...");
  const [packageName, setPackageName] = React.useState("Memuat...");

  // Editable fields
  const [selectedGuideId, setSelectedGuideId] = React.useState("");
  const [unknownGuideLabel, setUnknownGuideLabel] = React.useState<string | null>(null);
  const [registrationDate, setRegistrationDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);
  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const guideList = await getGuides().catch(() => []);
        setGuides(guideList || []);

        if (!id) return;
        const booking = await getBookingById(id);
        if (!booking) {
          showToast("error", "Pendaftaran dengan ID ini tidak ditemukan di database.");
          return;
        }
        setCode(booking.kode_booking);
        setJamaahName(booking.profiles?.full_name || "—");
        setPackageName(booking.packages?.name || "—");
        setNotes(booking.notes || "");
        if (booking.booking_date) {
          setRegistrationDate(String(booking.booking_date).slice(0, 10));
        } else if (booking.created_at) {
          setRegistrationDate(new Date(booking.created_at).toISOString().split("T")[0]);
        }
        setSelectedGuideId(booking.guide_id || "");
        if (booking.guide_id && !(guideList || []).some((g) => g.id === booking.guide_id)) {
          // Pembimbing bisa jadi sudah nonaktif; tetap tampilkan namanya agar
          // memilih ulang tidak tanpa sengaja menghapus penugasannya.
          const orphan = await getGuideById(booking.guide_id).catch(() => null);
          if (orphan?.name) setUnknownGuideLabel(orphan.name);
        }
      } catch (err) {
        console.error("Gagal memuat data pendaftaran:", err);
        showToast("error", `Gagal memuat data pendaftaran: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      showToast("error", "ID pendaftaran tidak dikenali.");
      return;
    }
    if (!registrationDate) {
      showToast("error", "Tanggal pendaftaran wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBooking(id, {
        booking_date: registrationDate,
        guide_id: selectedGuideId || null,
        notes: notes.trim() || null,
      });
      showToast("success", "Perubahan pendaftaran tersimpan ke database.");
      setTimeout(() => router.push(`/pendaftaran/${id}`), 700);
    } catch (err: unknown) {
      console.error("Gagal memperbarui pendaftaran:", err);
      showToast("error", `Gagal menyimpan perubahan: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-xl">
      {/* Header section with Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/pendaftaran" className="hover:text-gray-900 transition">
            Pendaftaran
          </Link>
          <span>&gt;</span>
          <Link
            href={`/pendaftaran/${id || code}`}
            className="hover:text-gray-900 transition"
          >
            {code}
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Edit Pendaftaran</h1>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{code}</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {notice && (
          <div
            role="alert"
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
          {/* Header Info Text */}
          <div className="text-xs text-gray-600 font-medium pb-2 border-b border-gray-100">
            Jamaah: <span className="font-semibold text-gray-900">{jamaahName}</span> • Paket:{" "}
            <span className="font-semibold text-gray-900">{packageName}</span>
          </div>

          {/* Grid 2 Kolom: Pembimbing & Tanggal Daftar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pembimbing (opsional)
              </label>
              <select
                value={selectedGuideId}
                onChange={(e) => setSelectedGuideId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">— Tanpa Pembimbing —</option>
                {selectedGuideId &&
                  unknownGuideLabel &&
                  !guides.some((g) => g.id === selectedGuideId) && (
                    <option value={selectedGuideId}>{unknownGuideLabel}</option>
                  )}
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Daftar <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Catatan Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <Link
            href={`/pendaftaran/${id || code}`}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer text-center"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
