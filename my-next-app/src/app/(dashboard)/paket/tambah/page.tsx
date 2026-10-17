"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPackage, getPackageById, updatePackage } from "@/services/packageService";
import { getBranches, BranchRecord } from "@/services/branchService";

export default function TambahPaketPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);

  // Form Fields - Informasi Paket
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [branchId, setBranchId] = React.useState("");
  const [type, setType] = React.useState<"umroh" | "haji">("umroh");
  const [status, setStatus] = React.useState("Dibuka");
  const [price, setPrice] = React.useState<number>(0);
  const [downPayment, setDownPayment] = React.useState<number>(0);
  const [quota, setQuota] = React.useState<number>(0);
  const [durationDays, setDurationDays] = React.useState<number>(1);

  // Form Fields - Keberangkatan & Akomodasi
  const [departureDate, setDepartureDate] = React.useState("");
  const [departureCity, setDepartureCity] = React.useState("");
  const [hotelMakkah, setHotelMakkah] = React.useState("");
  const [hotelMadinah, setHotelMadinah] = React.useState("");
  const [airline, setAirline] = React.useState("");

  // Form Fields - Fasilitas & Deskripsi
  const [facilitiesIncluded, setFacilitiesIncluded] = React.useState("");
  const [facilitiesExcluded, setFacilitiesExcluded] = React.useState("");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    // Mode edit dibaca dari query string (?edit=<id>) memakai window agar
    // tidak memicu Suspense bailout saat build statis.
    const editParam = new URLSearchParams(window.location.search).get("edit");
    if (editParam) setEditId(editParam);

    getBranches()
      .then((rows) => {
        if (cancelled) return;
        setBranches(rows);
        const hq = rows.find((b) => b.is_headquarter) || rows[0];
        if (hq && !editParam) setBranchId(hq.id);
      })
      .catch((err) => console.error("Gagal memuat cabang:", err));

    if (editParam) {
      getPackageById(editParam)
        .then((pkg) => {
          if (cancelled || !pkg) return;
          setName(pkg.name || "");
          setCode(pkg.code || "");
          setBranchId(pkg.branch_id || "");
          setType(pkg.type);
          setStatus(pkg.is_active ? "Dibuka" : "Ditutup");
          setPrice(Number(pkg.price) || 0);
          setDownPayment(Number(pkg.down_payment) || 0);
          setQuota(Number(pkg.quota) || 0);
          setDurationDays(Number(pkg.duration_days) || 1);
          setDepartureDate(pkg.departure_date ? String(pkg.departure_date).slice(0, 10) : "");
          setDepartureCity(pkg.departure_city || "");
          setAirline(pkg.airline || "");
          setDescription(pkg.description || "");
          setFacilitiesExcluded((pkg.facilities_excluded || []).join(", "));

          const list = pkg.facilities || [];
          const hotelLine = (prefix: string) =>
            list.find((f) => f?.startsWith(prefix))?.slice(prefix.length).trim() || "";
          setHotelMakkah(hotelLine("Hotel Mekah: "));
          setHotelMadinah(hotelLine("Hotel Madinah: "));
          setFacilitiesIncluded(
            list
              .filter((f) => f && !f.startsWith("Hotel Mekah: ") && !f.startsWith("Hotel Madinah: "))
              .join(", ")
          );
        })
        .catch((err) => console.error("Gagal memuat paket:", err));
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const toList = (raw: string) =>
    raw.split(",").map((s) => s.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama Paket wajib diisi!");
      return;
    }
    if (!Number(price) || Number(price) <= 0) {
      showToast("error", "Harga paket harus lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || null,
        branch_id: branchId || null,
        type,
        price: Number(price) || 0,
        down_payment: Number(downPayment) || 0,
        quota: Number(quota) || 0,
        duration_days: Number(durationDays) || 1,
        departure_date: departureDate || null,
        departure_city: departureCity.trim() || null,
        airline: airline.trim() || null,
        facilities: [
          ...toList(facilitiesIncluded),
          `Hotel Mekah: ${hotelMakkah}`,
          `Hotel Madinah: ${hotelMadinah}`,
        ],
        facilities_excluded: toList(facilitiesExcluded),
        description,
        // "Dibuka" = aktif dijual; "Draft" dan "Ditutup" tidak ditampilkan sebagai aktif.
        is_active: status === "Dibuka",
      };

      if (editId) {
        await updatePackage(editId, payload);
      } else {
        await createPackage(payload);
      }

      showToast(
        "success",
        editId ? "Perubahan paket tersimpan ke database." : "Paket perjalanan berhasil disimpan!"
      );
      setTimeout(() => router.push("/paket"), 600);
    } catch (err: unknown) {
      console.error("Gagal menyimpan paket:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      {/* Header section */}
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/paket" className="hover:text-gray-900 transition">
            Paket
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{editId ? "Edit" : "Tambah"}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">
          {editId ? "Edit Paket" : "Tambah Paket"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Card 1: Informasi Paket */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Informasi Paket
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Paket <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Umroh Reguler 9 Hari"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode</label>
              <input
                type="text"
                placeholder="Contoh: PKG-UMR9"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">Tanpa Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "umroh" | "haji")}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="umroh">Umroh</option>
                <option value="haji">Haji</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="Dibuka">Dibuka</option>
                <option value="Draft">Draft</option>
                <option value="Ditutup">Ditutup</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uang Muka (DP) (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kuota</label>
              <input
                type="number"
                min={1}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value) || 1)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durasi (hari)
              </label>
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value) || 1)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Keberangkatan & Akomodasi */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Keberangkatan &amp; Akomodasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Berangkat
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kota Keberangkatan
              </label>
              <input
                type="text"
                placeholder="Jakarta / Surabaya"
                value={departureCity}
                onChange={(e) => setDepartureCity(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Mekah
              </label>
              <select
                value={hotelMakkah}
                onChange={(e) => setHotelMakkah(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="Swissôtel Al Maqam Makkah">Swissôtel Al Maqam Makkah</option>
                <option value="Fairmont Makkah Clock Royal Tower">Fairmont Makkah Clock Royal Tower</option>
                <option value="Pullman Zamzam Makkah">Pullman Zamzam Makkah</option>
                <option value="Makkah Hotel & Towers">Makkah Hotel &amp; Towers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Madinah
              </label>
              <select
                value={hotelMadinah}
                onChange={(e) => setHotelMadinah(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="Dar Al Taqwa Hotel Madinah">Dar Al Taqwa Hotel Madinah</option>
                <option value="The Oberoi Madinah">The Oberoi Madinah</option>
                <option value="Rove Al Madinah Hotel">Rove Al Madinah Hotel</option>
                <option value="Anwar Al Madinah Mövenpick">Anwar Al Madinah Mövenpick</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maskapai</label>
            <select
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            >
              <option value="Saudia Airlines">Saudia Airlines</option>
              <option value="Garuda Indonesia">Garuda Indonesia</option>
              <option value="Qatar Airways">Qatar Airways</option>
              <option value="Emirates">Emirates</option>
            </select>
          </div>
        </div>

        {/* Card 3: Fasilitas & Deskripsi */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Fasilitas &amp; Deskripsi
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fasilitas Termasuk
            </label>
            <textarea
              rows={3}
              placeholder="Pisahkan dengan koma..."
              value={facilitiesIncluded}
              onChange={(e) => setFacilitiesIncluded(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fasilitas Tidak Termasuk
            </label>
            <textarea
              rows={3}
              placeholder="Pisahkan dengan koma..."
              value={facilitiesExcluded}
              onChange={(e) => setFacilitiesExcluded(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              rows={4}
              placeholder="Deskripsi lengkap tentang paket ibadah ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>
        </div>

        {/* Tombol Simpan & Batal */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/paket"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-6 py-2.5 rounded-lg transition shadow-sm"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
