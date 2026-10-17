export interface Quota {
  total: number;
}

export interface Package {
  id: string;
  kategori: string;
  durasi: string;
  nama: string;
  harga: number;
  badge?: string;
  keberangkatan: string;
  embarkasi: string;
  maskapai: string;
  hotelMekah: string | null;
  hotelMadinah: string | null;
  kuota: Quota;
  fasilitas: string[];
}

export interface Feature {
  id: string;
  iconName: "ShieldCheck" | "Building2" | "Users" | "Plane";
  title: string;
  description: string;
}

// Catatan: FEATURES adalah salinan pemasaran umum (bukan data komersial seperti
// harga/nama paket/hotel), jadi tetap dipertahankan. Data paket itu sendiri tidak
// lagi punya fallback statis — semuanya diambil dari tabel `packages` di Supabase.
export const FEATURES: Feature[] = [
  {
    id: "feature-1",
    iconName: "ShieldCheck",
    title: "Izin Resmi Kemenag",
    description: "Penyelenggara Perjalanan Ibadah Umroh (PPIU) dengan rekam jejak amanah & profesional.",
  },
  {
    id: "feature-2",
    iconName: "Building2",
    title: "Hotel Depan Pelataran",
    description: "Akomodasi bintang 5 berjarak 30–80 meter langsung melangkah menuju Masjidil Haram.",
  },
  {
    id: "feature-3",
    iconName: "Users",
    title: "Muthawif Bersertifikat",
    description: "Bimbingan ibadah intensif sesuai Al-Qur'an dan Sunnah sejak manasik di tanah air.",
  },
  {
    id: "feature-4",
    iconName: "Plane",
    title: "Penerbangan Langsung",
    description: "Terbang nyaman tanpa transit bersama maskapai terbaik pilihan mitra perjalanan kami.",
  },
];

import { createClient } from "@/lib/supabase/client";

// Memetakan HANYA kolom nyata pada tabel `packages`. Tidak ada nilai karangan:
// kolom yang kosong dirender sebagai empty state yang jujur oleh komponen.
export async function fetchLivePackages(): Promise<Package[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((p) => {
      const facilities: string[] = Array.isArray(p.facilities) ? p.facilities : [];

      // Nama hotel hanya diekstrak bila benar-benar tertulis di fasilitas DB.
      // Tidak ada karangan nama hotel bila kosong.
      const hotelMekah =
        facilities.find((f: string) => /mekah|makkah|makka|haram/i.test(f)) ?? null;
      const hotelMadinah =
        facilities.find((f: string) => /madinah|madina|nabawi/i.test(f)) ?? null;

      const keberangkatan = p.departure_date
        ? new Date(p.departure_date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Jadwal menyusul";

      return {
        id: p.id,
        kategori: p.type === "haji" ? "HAJI" : "UMROH",
        durasi: p.duration_days ? `${p.duration_days} Hari` : "Durasi menyusul",
        nama: p.name,
        harga: Number(p.price) || 0,
        badge: undefined,
        keberangkatan,
        embarkasi: p.departure_city || "Belum ditentukan",
        maskapai: p.airline || "Belum ditentukan",
        hotelMekah,
        hotelMadinah,
        kuota: { total: Number(p.quota) || 0 },
        fasilitas: facilities,
      };
    });
  } catch {
    return [];
  }
}
