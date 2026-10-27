"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Layers, Users, CheckCircle2 } from "lucide-react";
import { createBooking } from "@/services/bookingService";
import {
  getPackages,
  isBookable,
  seatsLeftFor,
  downPaymentFor,
  PackageRow,
} from "@/services/packageService";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";
import { getGuides, GuideRow } from "@/services/guideService";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import type { BookingRoomType } from "@/types/supabase.types";

const ROOM_OPTIONS: { value: BookingRoomType; label: string }[] = [
  { value: "single", label: "Single (1 orang / kamar)" },
  { value: "double", label: "Double (2 orang / kamar)" },
  { value: "triple", label: "Triple (3 orang / kamar)" },
  { value: "quad", label: "Quad (4 orang / kamar)" },
];

export default function DaftarkanJamaahPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  const [pilgrims, setPilgrims] = React.useState<JamaahProfile[]>([]);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [guides, setGuides] = React.useState<GuideRow[]>([]);

  const [selectedPilgrimId, setSelectedPilgrimId] = React.useState("");
  const [selectedPkgId, setSelectedPkgId] = React.useState("");
  const [selectedGuideId, setSelectedGuideId] = React.useState("");
  const [roomType, setRoomType] = React.useState<BookingRoomType | "">("");
  const [registrationDate, setRegistrationDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 5000);
  };

  React.useEffect(() => {
    setRegistrationDate(today);
  }, [today]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      const [plgList, pkgList, gdList] = await Promise.all([
        getJamaahList().catch(() => [] as JamaahProfile[]),
        getPackages().catch(() => [] as PackageRow[]),
        getGuides().catch(() => [] as GuideRow[]),
      ]);
      if (cancelled) return;
      setPilgrims(plgList);
      setPackages(pkgList.filter(isBookable));
      setGuides(gdList);
      setIsLoading(false);
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) ?? null;
  const selectedPilgrim = pilgrims.find((p) => p.id === selectedPilgrimId) ?? null;
  const dpAmount = selectedPkg ? downPaymentFor(selectedPkg) : 0;
  const sisa = selectedPkg ? seatsLeftFor(selectedPkg) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPilgrimId) return showToast("error", "Silakan pilih Jamaah terlebih dahulu!");
    if (!selectedPkg) return showToast("error", "Silakan pilih Paket terlebih dahulu!");
    if (!registrationDate) return showToast("error", "Tanggal Booking wajib diisi!");

    // Cek ini hanya untuk umpan balik cepat; database tetap yang memutuskan
    // lewat trigger kuota karena paket bisa terisi orang lain saat form terbuka.
    if (sisa !== null && sisa <= 0) {
      return showToast("error", `Kuota "${selectedPkg.name}" sudah penuh.`);
    }
    if (!Number(selectedPkg.price)) {
      return showToast("error", "Harga paket terpilih tidak ditemukan di database.");
    }

    setIsSubmitting(true);
    try {
      const created = await createBooking({
        pilgrim_id: selectedPilgrimId,
        package_id: selectedPkg.id,
        guide_id: selectedGuideId || null,
        room_type: roomType || null,
        booking_date: registrationDate,
        departure_date: selectedPkg.departure_date || null,
        total_price: Number(selectedPkg.price),
        notes: notes.trim() || null,
        status: "pending",
      });

      showToast(
        "success",
        `Pendaftaran ${created.kode_booking} tersimpan. Tagihan DP ${formatRupiah(
          dpAmount
        )} otomatis dibuat.`
      );
      setTimeout(() => router.push(`/pendaftaran/${created.id}`), 900);
    } catch (err: unknown) {
      console.error("Gagal mendaftarkan jamaah:", err);
      showToast("error", (err as Error).message);
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm disabled:bg-gray-50 disabled:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-6 md:p-8 space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-900 transition">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/pendaftaran" className="hover:text-gray-900 transition">
          Pendaftaran
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Booking Baru</span>
      </nav>

      <div className="flex items-start gap-3">
        <Link
          href="/pendaftaran"
          aria-label="Kembali ke daftar pendaftaran"
          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Jamaah Baru</h1>
          <p className="text-sm text-gray-500">
            Daftarkan jamaah ke paket umroh atau haji dengan validasi kuota otomatis.
          </p>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start"
      >
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Users className="h-5 w-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900">Informasi Calon Jamaah &amp; Paket</h2>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Memuat data jamaah dan paket...</p>
          ) : (
            <>
              <div>
                <label htmlFor="pilgrim" className={labelClass}>
                  Pilih Jamaah <span className="text-red-500">*</span>
                </label>
                <select
                  id="pilgrim"
                  value={selectedPilgrimId}
                  onChange={(e) => setSelectedPilgrimId(e.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">-- Pilih Jamaah Terdaftar --</option>
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.passportNumber ? ` — ${p.passportNumber}` : ""}
                    </option>
                  ))}
                </select>
                {pilgrims.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Belum ada jamaah terdaftar. Tambahkan lewat menu Data Jamaah.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="package" className={labelClass}>
                  Pilih Paket Umroh / Haji <span className="text-red-500">*</span>
                </label>
                <select
                  id="package"
                  value={selectedPkgId}
                  onChange={(e) => setSelectedPkgId(e.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">-- Pilih Paket Keberangkatan --</option>
                  {packages.map((pkg) => {
                    const left = seatsLeftFor(pkg);
                    return (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} | Berangkat: {pkg.departure_date || "belum ditentukan"} |
                        Sisa Kuota: {left === null ? "bebas" : `${left} pax`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Hanya paket aktif dengan sisa kuota yang ditampilkan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guide" className={labelClass}>
                    Pembimbing / Muthawif{" "}
                    <span className="text-xs font-normal text-gray-400">(Opsional)</span>
                  </label>
                  <select
                    id="guide"
                    value={selectedGuideId}
                    onChange={(e) => setSelectedGuideId(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">-- Tanpa Pembimbing Khusus --</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className={labelClass}>
                    Tanggal Booking <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={registrationDate}
                    max={today}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="room" className={labelClass}>
                    Tipe Kamar{" "}
                    <span className="text-xs font-normal text-gray-400">(Opsional)</span>
                  </label>
                  <select
                    id="room"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as BookingRoomType | "")}
                    className={fieldClass}
                  >
                    <option value="">-- Belum ditentukan --</option>
                    {ROOM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className={labelClass}>
                  Catatan Tambahan / Permintaan Khusus
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Permintaan satu kamar dengan keluarga, riwayat kursi roda, dsb."
                  className={fieldClass}
                />
              </div>
            </>
          )}
        </div>

        <aside className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm lg:sticky lg:top-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Layers className="h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Ringkasan Booking
            </h2>
          </div>

          {!selectedPkg ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              Pilih paket untuk melihat detail harga, kuota, dan jadwal keberangkatan.
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-400">Paket Terpilih</p>
                <p className="font-semibold text-gray-900">{selectedPkg.name}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    sisa && sisa > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  Sisa Kuota: {sisa === null ? "Tidak dibatasi" : `${sisa} Kursi`}
                </span>
              </div>

              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-400">Jadwal Keberangkatan</p>
                <p className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {selectedPkg.departure_date
                    ? formatDateIndo(selectedPkg.departure_date)
                    : "Belum dijadwalkan"}
                </p>
              </div>

              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-400">Total Harga Paket</p>
                <p className="text-lg font-bold text-teal-700">
                  {formatRupiah(Number(selectedPkg.price))}
                </p>
              </div>

              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500">Uang Muka (DP Otomatis):</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {formatRupiah(dpAmount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  * Tagihan DP otomatis diterbitkan dengan jatuh tempo 7 hari kalender.
                </p>
              </div>

              {selectedPilgrim && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  Jamaah: <span className="font-medium">{selectedPilgrim.name}</span>
                  {selectedPilgrim.passportNumber
                    ? ` · Paspor ${selectedPilgrim.passportNumber}`
                    : ""}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Mendaftarkan..." : "Daftarkan Jamaah Sekarang"}
            </button>
            <Link
              href="/pendaftaran"
              className="block w-full text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2.5 rounded-lg transition"
            >
              Batal
            </Link>
          </div>
        </aside>
      </form>

      {selectedPkg && !isLoading && (
        <p className="flex items-center gap-2 text-xs text-gray-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
          Kuota divalidasi ulang oleh database saat penyimpanan, jadi dua orang tidak bisa
          mengambil kursi terakhir yang sama.
        </p>
      )}
    </div>
  );
}
