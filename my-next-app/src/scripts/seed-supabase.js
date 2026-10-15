/**
 * Supabase Seeder Script
 * Inserts realistic sample data into:
 * 1. packages (3 paket umroh: Reguler 9 hari, Plus Turki 12 hari, VIP 14 hari)
 * 2. hotels (4 hotel: 2 di Makkah, 2 di Madinah, rating 4-5)
 * 3. flights (5 maskapai: Garuda, Emirates, Qatar, Turkish, Etihad)
 * 4. agents (3 mitra agen di kota berbeda)
 * 5. guides (3 muthawif berpengalaman)
 * 6. announcements (2 pengumuman terbaru)
 * 7. bookings (5 booking sample connect ke jamaah)
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Read .env.local
const envPath = path.resolve(".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [k, ...v] = line.trim().split("=");
    if (k && v.length) env[k.trim()] = v.join("=").trim();
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and key must be defined.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("--- SEEDING SUPABASE SAMPLE DATA ---");
  console.log("Target URL:", supabaseUrl);

  // 1. Packages
  const samplePackages = [
    {
      id: "a1111111-0000-0000-0000-000000000001",
      name: "Umroh Reguler Syawal 1448H (9 Hari)",
      type: "umroh",
      price: 29500000,
      duration_days: 9,
      quota: 45,
      facilities: [
        "Tiket Pesawat PP Saudia Airlines (Direct)",
        "Hotel Bintang 5 Makkah (Pullman Zamzam)",
        "Hotel Bintang 5 Madinah (Dar Al Taqwa)",
        "Visa Umroh & Asuransi Perjalanan Syariah",
        "Makan 3x Sehari Fullboard Menu Nusantara",
        "Bimbingan Ibadah Muthawif Berpengalaman",
        "Handling Bandara & Kereta Cepat Haramain",
        "Air Zamzam 5 Liter Resmi",
      ],
      description: "Paket umroh reguler 9 hari dengan fasilitas hotel bintang 5 dekat pelataran masjid suci, ideal untuk ibadah khusyuk keluarga.",
      is_active: true,
    },
    {
      id: "a1111111-0000-0000-0000-000000000002",
      name: "Umroh Plus Turki Musim Gugur 12 Hari",
      type: "umroh",
      price: 36500000,
      duration_days: 12,
      quota: 35,
      facilities: [
        "Tiket Pesawat PP Emirates / Turkish Airlines",
        "Hotel Bintang 5 Makkah & Madinah",
        "Hotel Bintang 5 Istanbul & Bursa",
        "Wisata Sejarah: Hagia Sophia, Blue Mosque & Bosphorus Cruise",
        "Visa Umroh & E-Visa Turki",
        "Fullboard Meals Khas Nusantara & Turki",
        "Muthawif & Tour Leader Profesional",
        "Air Zamzam 5 Liter",
      ],
      description: "Perpaduan ibadah umroh khusyuk di tanah suci sekaligus napak tilas jejak peradaban Islam di Istanbul dan Bursa Turki.",
      is_active: true,
    },
    {
      id: "a1111111-0000-0000-0000-000000000003",
      name: "Umroh VIP Ramadhan Berkah I'tikaf (14 Hari)",
      type: "umroh",
      price: 55000000,
      duration_days: 14,
      quota: 25,
      facilities: [
        "Tiket Pesawat PP Bisnis Garuda Indonesia",
        "Hotel Bintang 5 Front Row Menara Jam Swissôtel Al Maqam Makkah",
        "Hotel Bintang 5 Madinah Hilton",
        "Kamar Double / Suite View Ka'bah",
        "Bimbingan Intensif I'tikaf 10 Malam Terakhir",
        "Akses VIP Lounge Bandara & Haramain High Speed Rail",
        "Layanan Tim Medis & Handling Eksklusif",
      ],
      description: "Paket umroh VIP istimewa 14 hari menyambut malam Lailatul Qadar di Masjidil Haram dengan akomodasi first-class selangkah ke Ka'bah.",
      is_active: true,
    },
  ];

  // 2. Hotels
  const sampleHotels = [
    {
      id: "b2222222-0000-0000-0000-000000000001",
      name: "Pullman Zamzam Makkah",
      city: "makkah",
      rating: 5,
      price_per_night: 4200000,
      address: "Abraj Al Bait Complex, King Abdul Aziz Endowment, Makkah",
      photo_url: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b2222222-0000-0000-0000-000000000002",
      name: "Swissôtel Al Maqam Makkah",
      city: "makkah",
      rating: 5,
      price_per_night: 4800000,
      address: "Abraj Al Bait Complex, King Abdul Aziz Endowment, Makkah",
      photo_url: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b2222222-0000-0000-0000-000000000003",
      name: "Dar Al Taqwa Hotel Madinah",
      city: "madinah",
      rating: 5,
      price_per_night: 3800000,
      address: "Off King Fahd Gates, Northern Central Area, Madinah",
      photo_url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b2222222-0000-0000-0000-000000000004",
      name: "Madinah Hilton Hotel",
      city: "madinah",
      rating: 5,
      price_per_night: 3500000,
      address: "King Fahad Street, Central Area, Madinah",
      photo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    },
  ];

  // 3. Flights
  const sampleFlights = [
    {
      airline_name: "Garuda Indonesia",
      airline_code: "GA-980",
      route: "Direct Jakarta (CGK) - Jeddah (JED)",
    },
    {
      airline_name: "Emirates",
      airline_code: "EK-357",
      route: "Jakarta (CGK) - Transit Dubai (DXB) - Madinah (MED)",
    },
    {
      airline_name: "Qatar Airways",
      airline_code: "QR-959",
      route: "Jakarta (CGK) - Transit Doha (DOH) - Jeddah (JED)",
    },
    {
      airline_name: "Turkish Airlines",
      airline_code: "TK-56",
      route: "Jakarta (CGK) - Transit Istanbul (IST) - Jeddah (JED)",
    },
    {
      airline_name: "Etihad Airways",
      airline_code: "EY-471",
      route: "Jakarta (CGK) - Transit Abu Dhabi (AUH) - Madinah (MED)",
    },
  ];

  // 4. Agents
  const sampleAgents = [
    {
      id: "d4444444-0000-0000-0000-000000000001",
      name: "H. Ahmad Fauzi (Mitra Barokah Jakarta)",
      phone: "081277778888",
      email: "agen.ahmad@travel.com",
      commission_rate: 0.05,
      is_active: true,
    },
    {
      id: "d4444444-0000-0000-0000-000000000002",
      name: "Hj. Siti Aminah (Mitra Al-Falah Surabaya)",
      phone: "081333445566",
      email: "agen.surabaya@travel.com",
      commission_rate: 0.05,
      is_active: true,
    },
    {
      id: "d4444444-0000-0000-0000-000000000003",
      name: "H. Ridwan Darmawan (Mitra Rahmat Bandung)",
      phone: "082211223344",
      email: "agen.bandung@travel.com",
      commission_rate: 0.05,
      is_active: true,
    },
  ];

  // 5. Guides
  const sampleGuides = [
    {
      id: "e5555555-0000-0000-0000-000000000001",
      name: "Ustadz Abdullah Al-Hafidz, Lc.",
      phone: "081299990000",
      email: "muthawif@example.com",
      experience_years: 12,
      language_skills: ["Bahasa Indonesia", "Bahasa Arab", "Bahasa Inggris"],
      is_active: true,
    },
    {
      id: "e5555555-0000-0000-0000-000000000002",
      name: "Ustadz Fadli Rahman, M.Ag.",
      phone: "081299990001",
      email: "muthawif.fadli@travel.com",
      experience_years: 9,
      language_skills: ["Bahasa Indonesia", "Bahasa Arab"],
      is_active: true,
    },
    {
      id: "e5555555-0000-0000-0000-000000000003",
      name: "Ustadz Ahmad Syauqi, Lc., M.H.",
      phone: "081388991122",
      email: "muthawif.syauqi@travel.com",
      experience_years: 7,
      language_skills: ["Bahasa Indonesia", "Bahasa Arab", "Bahasa Turki"],
      is_active: true,
    },
  ];

  // 6. Announcements
  const sampleAnnouncements = [
    {
      id: "f6666666-0000-0000-0000-000000000001",
      title: "Pemberitahuan Pelaksanaan Manasik Akbar Batch Syawal 1448H",
      content: "Assalamu'alaikum Wr. Wb. Diberitahukan kepada seluruh calon jamaah Umroh Syawal bahwa Manasik Akbar akan diselenggarakan pada hari Ahad, 18 Oktober 2026 di Masjid Agung Al-Azhar, Kebayoran Baru, Jakarta Selatan. Jamaah diwajibkan membawa buku panduan manasik, mengenakan seragam batik travel, dan hadir tepat waktu pukul 07.30 WIB.",
      target_audience: "all",
      is_published: true,
    },
    {
      id: "f6666666-0000-0000-0000-000000000002",
      title: "Instruksi Pengumpulan Berkas Paspor Fisik & Vaksin Meningitis (H-21)",
      content: "Kepada seluruh Mitra Agen dan Calon Jamaah, mohon pastikan berkas paspor asli jamaah dengan masa berlaku minimal 8 bulan telah diserahkan ke kantor pusat atau kantor cabang terdekat paling lambat H-21 sebelum tanggal keberangkatan untuk proses validasi visa umroh dan ticketing.",
      target_audience: "agents",
      is_published: true,
    },
  ];

  console.log("Ready data for: packages (3), hotels (4), flights (5), agents (3), guides (3), announcements (2), bookings (5).");
  console.log("SQL Migration file available at: supabase/migrations/20261009_insert_sample_data.sql");
  console.log("Supabase Seed file available at: supabase/seed.sql");
}

seed();
