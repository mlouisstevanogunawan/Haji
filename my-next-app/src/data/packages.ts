export interface Quota {
  terisi: number;
  total: number;
}

export interface Package {
  id: string;
  kategori: string;
  durasi: string;
  nama: string;
  harga: number;
  badge: string;
  keberangkatan: string;
  embarkasi: string;
  maskapai: string;
  hotelMekah: string;
  hotelMadinah: string;
  kuota: Quota;
  fasilitas: string[];
}

export interface Feature {
  id: string;
  iconName: "ShieldCheck" | "Building2" | "Users" | "Plane";
  title: string;
  description: string;
}

export const PACKAGES: Package[] = [
  {
    id: "paket-reguler",
    kategori: "UMROH REGULER",
    durasi: "9 Hari",
    nama: "Umroh Reguler Syawal 1447H",
    harga: 29500000,
    badge: "Paling Diminati",
    keberangkatan: "15 Okt 2026",
    embarkasi: "Jakarta (CGK)",
    maskapai: "Saudia Airlines (Direct CGK - MED)",
    hotelMekah: "Swissôtel Al Maqam (Bintang 5 - 50m)",
    hotelMadinah: "Dar Al Taqwa (Bintang 5 - 30m)",
    kuota: { terisi: 12, total: 45 },
    fasilitas: [
      "Tiket Pesawat PP Direct",
      "Hotel Bintang 5 Dekat Masjid",
      "Makan 3x Sehari Fullboard Indonesia",
      "Visa Umroh & Asuransi Perjalanan",
      "Handling Bandara & Muthawif Pembimbing",
    ],
  },
  {
    id: "paket-ramadhan",
    kategori: "UMROH RAMADHAN",
    durasi: "12 Hari",
    nama: "Umroh Ramadhan Berkah I'tikaf",
    harga: 42000000,
    badge: "I'tikaf 10 Malam Terakhir",
    keberangkatan: "05 Nov 2026",
    embarkasi: "Jakarta (CGK)",
    maskapai: "Garuda Indonesia (Direct CGK - JED)",
    hotelMekah: "Pullman Zamzam (Bintang 5 - 80m)",
    hotelMadinah: "Madinah Hilton (Bintang 5 - 70m)",
    kuota: { terisi: 8, total: 40 },
    fasilitas: [
      "Tiket PP Garuda Indonesia",
      "Bimbingan I'tikaf Khusus Muthawif",
      "Fullboard Sahur & Iftar Lezat",
      "Kereta Cepat Haramain Makkah-Madinah",
      "Perlengkapan Umroh Eksklusif",
    ],
  },
  {
    id: "paket-haji-khusus",
    kategori: "HAJI KHUSUS",
    durasi: "25 Hari",
    nama: "Haji Khusus Furoda VIP Mujamalah",
    harga: 265000000,
    badge: "Langsung Berangkat Tanpa Antre",
    keberangkatan: "20 Mei 2027",
    embarkasi: "Jakarta (CGK)",
    maskapai: "Garuda Indonesia Business Class",
    hotelMekah: "Swissôtel Al Maqam VIP Suite",
    hotelMadinah: "Dar Al Taqwa Executive Suite",
    kuota: { terisi: 4, total: 20 },
    fasilitas: [
      "Visa Haji Mujamalah Resmi Kemenag",
      "Maktab Tenda VIP Ber-AC Mina & Arafah",
      "Kereta Cepat Haramain High-Speed Train",
      "Ziarah Eksklusif Tempat Bersejarah",
      "Dokter & Tim Medis Pendamping 24 Jam",
    ],
  },
];

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
    description: "Terbang nyaman tanpa transit bersama Saudia Airlines dan maskapai terbaik Garuda Indonesia.",
  },
];

import { createClient } from "@/lib/supabase/client";

export async function fetchLivePackages(): Promise<Package[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("price", { ascending: true });

    if (error || !data || data.length === 0) {
      return PACKAGES;
    }

    return data.map((p) => {
      const facilities = p.facilities || [];
      const hotelMekah = facilities.find((f: string) => f.toLowerCase().includes("makkah")) || "Swissôtel Al Maqam (Bintang 5)";
      const hotelMadinah = facilities.find((f: string) => f.toLowerCase().includes("madinah")) || "Dar Al Taqwa (Bintang 5)";
      const maskapai = facilities.find((f: string) => /garuda|saudia|emirates|qatar|lion/i.test(f)) || "Saudia Airlines (Direct)";

      return {
        id: p.id,
        kategori: p.type === "haji" ? "HAJI KHUSUS" : "UMROH REGULER",
        durasi: `${p.duration_days} Hari`,
        nama: p.name,
        harga: Number(p.price),
        badge: p.type === "haji" ? "Langsung Berangkat" : "Paling Diminati",
        keberangkatan: new Date(p.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        embarkasi: "Jakarta (CGK)",
        maskapai,
        hotelMekah,
        hotelMadinah,
        kuota: { terisi: 0, total: p.quota || 45 },
        fasilitas: facilities.length > 0 ? facilities : [
          "Tiket Pesawat PP Direct",
          "Hotel Bintang 5 Dekat Masjid",
          "Makan 3x Sehari Fullboard Indonesia",
          "Visa Umroh & Asuransi Perjalanan",
          "Handling Bandara & Muthawif Pembimbing",
        ],
      };
    });
  } catch {
    return PACKAGES;
  }
}
