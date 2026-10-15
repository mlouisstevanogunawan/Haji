-- ==============================================================================
-- Migration & Seed: Insert Sample Data into Travel Management Tables
-- 1. packages (3 paket: Reguler 9 hari, Plus Turki 12 hari, VIP 14 hari)
-- 2. hotels (4 hotel: 2 di Makkah, 2 di Madinah bintang 4-5)
-- 3. flights (5 maskapai: Garuda, Emirates, Qatar, Turkish, Etihad)
-- 4. agents (3 mitra agen di kota berbeda)
-- 5. guides (3 muthawif berpengalaman)
-- 6. announcements (2 pengumuman terbaru)
-- 7. bookings (5 booking sample yang connect ke jamaah)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Ensure profiles exist for sample pilgrims, agents, and guides
-- ------------------------------------------------------------------------------
do $$
declare
  v_jkt_branch uuid;
  v_bdg_branch uuid;
  v_sby_branch uuid;
begin
  select id into v_jkt_branch from public.branches where code = 'JKT' limit 1;
  select id into v_bdg_branch from public.branches where code = 'BDG' limit 1;
  select id into v_sby_branch from public.branches where code = 'SBY' limit 1;

  -- Default branches fallback
  if v_jkt_branch is null then
    insert into public.branches (name, code, address, is_active)
    values ('Kantor Pusat Jakarta', 'JKT', 'Jl. M.H. Thamrin No. 12, Menteng, Jakarta Pusat', true)
    returning id into v_jkt_branch;
  end if;

  -- 1. Profiles for Jamaah (Pilgrims)
  insert into public.profiles (id, email, full_name, role, phone, branch_id, is_active)
  values 
    ('11111111-1111-1111-1111-111111111101', 'yushan.thoriqzhafif@alazhar.sch.id', 'YUSHAN THORIQ ZHAFIF AL-HAKIM', 'jamaah', '123456789088', v_jkt_branch, true),
    ('11111111-1111-1111-1111-111111111102', 'thoriq.syng@gmail.com', 'Yushan Thoriq', 'jamaah', '089523818740', v_jkt_branch, true),
    ('11111111-1111-1111-1111-111111111103', 'yushan.hakim.20011947@student.amikom.ac.id', 'Yushan Hakim', 'jamaah', '088242700645', v_bdg_branch, true),
    ('11111111-1111-1111-1111-111111111104', 'jamaah@example.com', 'Ahmad Fauzi', 'jamaah', '081233445566', v_jkt_branch, true),
    ('11111111-1111-1111-1111-111111111105', 'jamaah.budi@travel.com', 'Budi Santoso (Calon Jamaah)', 'jamaah', '081212345678', v_jkt_branch, true)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;

  -- 2. Profiles for Agents
  insert into public.profiles (id, email, full_name, role, phone, branch_id, is_active)
  values 
    ('22222222-2222-2222-2222-222222222201', 'agen.ahmad@travel.com', 'Ahmad Fauzi (Mitra Agen)', 'mitra_agen', '081277778888', v_jkt_branch, true),
    ('22222222-2222-2222-2222-222222222202', 'agen@example.com', 'Hasan Basri (Mitra Agen)', 'mitra_agen', '081233339999', v_jkt_branch, true),
    ('22222222-2222-2222-2222-222222222203', 'agen.bandung@travel.com', 'H. Ridwan Darmawan (Mitra Bandung)', 'mitra_agen', '082211223344', v_bdg_branch, true)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;

  -- 3. Profiles for Guides (Muthawif)
  insert into public.profiles (id, email, full_name, role, phone, branch_id, is_active)
  values 
    ('33333333-3333-3333-3333-333333333301', 'muthawif@example.com', 'Ustadz Abdullah (Muthawif)', 'muthawif', '081299990000', v_jkt_branch, true),
    ('33333333-3333-3333-3333-333333333302', 'muthawif.fadli@travel.com', 'Ustadz Fadli Rahman (Muthawif)', 'muthawif', '081299990000', v_jkt_branch, true),
    ('33333333-3333-3333-3333-333333333303', 'muthawif.syauqi@travel.com', 'Ustadz Ahmad Syauqi, Lc.', 'muthawif', '081388991122', v_jkt_branch, true)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;
end $$;

-- ------------------------------------------------------------------------------
-- 1. PACKAGES (3 Paket Umroh Realistis)
-- ------------------------------------------------------------------------------
insert into public.packages (id, name, type, price, duration_days, quota, facilities, description, is_active)
values
  (
    'a1111111-0000-0000-0000-000000000001',
    'Umroh Reguler Syawal 1448H (9 Hari)',
    'umroh',
    29500000.00,
    9,
    45,
    ARRAY[
      'Tiket Pesawat PP Saudia Airlines (Direct)',
      'Hotel Bintang 5 Makkah (Pullman Zamzam)',
      'Hotel Bintang 5 Madinah (Dar Al Taqwa)',
      'Visa Umroh & Asuransi Perjalanan Syariah',
      'Makan 3x Sehari Fullboard Menu Nusantara',
      'Bimbingan Ibadah Muthawif Berpengalaman',
      'Handling Bandara & Kereta Cepat Haramain',
      'Air Zamzam 5 Liter Resmi'
    ],
    'Paket umroh reguler 9 hari dengan fasilitas hotel bintang 5 dekat pelataran masjid suci, ideal untuk ibadah khusyuk keluarga.',
    true
  ),
  (
    'a1111111-0000-0000-0000-000000000002',
    'Umroh Plus Turki Musim Gugur 12 Hari',
    'umroh',
    36500000.00,
    12,
    35,
    ARRAY[
      'Tiket Pesawat PP Emirates / Turkish Airlines',
      'Hotel Bintang 5 Makkah & Madinah',
      'Hotel Bintang 5 Istanbul & Bursa',
      'Wisata Sejarah: Hagia Sophia, Blue Mosque & Bosphorus Cruise',
      'Visa Umroh & E-Visa Turki',
      'Fullboard Meals Khas Nusantara & Turki',
      'Muthawif & Tour Leader Profesional',
      'Air Zamzam 5 Liter'
    ],
    'Perpaduan ibadah umroh khusyuk di tanah suci sekaligus napak tilas jejak peradaban Islam di Istanbul dan Bursa Turki.',
    true
  ),
  (
    'a1111111-0000-0000-0000-000000000003',
    'Umroh VIP Ramadhan Berkah I''tikaf (14 Hari)',
    'umroh',
    55000000.00,
    14,
    25,
    ARRAY[
      'Tiket Pesawat PP Bisnis Garuda Indonesia',
      'Hotel Bintang 5 Front Row Menara Jam Swissôtel Al Maqam Makkah',
      'Hotel Bintang 5 Madinah Hilton',
      'Kamar Double / Suite View Ka''bah',
      'Bimbingan Intensif I''tikaf 10 Malam Terakhir',
      'Akses VIP Lounge Bandara & Haramain High Speed Rail',
      'Layanan Tim Medis & Handling Eksklusif'
    ],
    'Paket umroh VIP istimewa 14 hari menyambut malam Lailatul Qadar di Masjidil Haram dengan akomodasi first-class selangkah ke Ka''bah.',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  price = excluded.price,
  duration_days = excluded.duration_days,
  quota = excluded.quota,
  facilities = excluded.facilities,
  description = excluded.description,
  is_active = excluded.is_active;

-- ------------------------------------------------------------------------------
-- 2. HOTELS (4 Hotel: 2 Makkah, 2 Madinah Bintang 4-5)
-- ------------------------------------------------------------------------------
insert into public.hotels (id, name, city, rating, price_per_night, address, photo_url)
values
  (
    'b2222222-0000-0000-0000-000000000001',
    'Pullman Zamzam Makkah',
    'makkah',
    5,
    4200000.00,
    'Abraj Al Bait Complex, King Abdul Aziz Endowment, Makkah',
    'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'b2222222-0000-0000-0000-000000000002',
    'Swissôtel Al Maqam Makkah',
    'makkah',
    5,
    4800000.00,
    'Abraj Al Bait Complex, King Abdul Aziz Endowment, Makkah',
    'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'b2222222-0000-0000-0000-000000000003',
    'Dar Al Taqwa Hotel Madinah',
    'madinah',
    5,
    3800000.00,
    'Off King Fahd Gates, Northern Central Area, Madinah',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'b2222222-0000-0000-0000-000000000004',
    'Madinah Hilton Hotel',
    'madinah',
    5,
    3500000.00,
    'King Fahad Street, Central Area, Madinah',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
  )
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  rating = excluded.rating,
  price_per_night = excluded.price_per_night,
  address = excluded.address,
  photo_url = excluded.photo_url;

-- ------------------------------------------------------------------------------
-- 3. FLIGHTS (5 Maskapai: Garuda, Emirates, Qatar, Turkish, Etihad)
-- ------------------------------------------------------------------------------
insert into public.flights (id, airline_name, airline_code, route)
values
  (
    'c3333333-0000-0000-0000-000000000001',
    'Garuda Indonesia',
    'GA-980',
    'Direct Jakarta (CGK) - Jeddah (JED)'
  ),
  (
    'c3333333-0000-0000-0000-000000000002',
    'Emirates',
    'EK-357',
    'Jakarta (CGK) - Transit Dubai (DXB) - Madinah (MED)'
  ),
  (
    'c3333333-0000-0000-0000-000000000003',
    'Qatar Airways',
    'QR-959',
    'Jakarta (CGK) - Transit Doha (DOH) - Jeddah (JED)'
  ),
  (
    'c3333333-0000-0000-0000-000000000004',
    'Turkish Airlines',
    'TK-56',
    'Jakarta (CGK) - Transit Istanbul (IST) - Jeddah (JED)'
  ),
  (
    'c3333333-0000-0000-0000-000000000005',
    'Etihad Airways',
    'EY-471',
    'Jakarta (CGK) - Transit Abu Dhabi (AUH) - Madinah (MED)'
  )
on conflict (airline_code) do update set
  airline_name = excluded.airline_name,
  route = excluded.route;

-- ------------------------------------------------------------------------------
-- 4. AGENTS (3 Mitra Agen di Kota Berbeda)
-- ------------------------------------------------------------------------------
insert into public.agents (id, user_id, name, phone, email, commission_rate, is_active)
values
  (
    'd4444444-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222201',
    'H. Ahmad Fauzi (Mitra Barokah Jakarta)',
    '081277778888',
    'agen.ahmad@travel.com',
    0.0500,
    true
  ),
  (
    'd4444444-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222202',
    'Hasan Basri (Mitra Al-Ikhlas Surabaya)',
    '081233339999',
    'agen@example.com',
    0.0500,
    true
  ),
  (
    'd4444444-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222203',
    'H. Ridwan Darmawan (Mitra Rahmat Bandung)',
    '082211223344',
    'agen.bandung@travel.com',
    0.0500,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  commission_rate = excluded.commission_rate,
  is_active = excluded.is_active;

-- ------------------------------------------------------------------------------
-- 5. GUIDES (3 Muthawif Berpengalaman)
-- ------------------------------------------------------------------------------
insert into public.guides (id, user_id, name, phone, email, experience_years, language_skills, is_active)
values
  (
    'e5555555-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333301',
    'Ustadz Abdullah Al-Hafidz, Lc.',
    '081299990000',
    'muthawif@example.com',
    12,
    ARRAY['Bahasa Indonesia', 'Bahasa Arab', 'Bahasa Inggris'],
    true
  ),
  (
    'e5555555-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333302',
    'Ustadz Fadli Rahman, M.Ag.',
    '081299990000',
    'muthawif.fadli@travel.com',
    9,
    ARRAY['Bahasa Indonesia', 'Bahasa Arab'],
    true
  ),
  (
    'e5555555-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333303',
    'Ustadz Ahmad Syauqi, Lc., M.H.',
    '081388991122',
    'muthawif.syauqi@travel.com',
    7,
    ARRAY['Bahasa Indonesia', 'Bahasa Arab', 'Bahasa Turki'],
    true
  )
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  experience_years = excluded.experience_years,
  language_skills = excluded.language_skills,
  is_active = excluded.is_active;

-- ------------------------------------------------------------------------------
-- 6. ANNOUNCEMENTS (2 Pengumuman Terbaru)
-- ------------------------------------------------------------------------------
insert into public.announcements (id, title, content, target_audience, is_published, published_at)
values
  (
    'f6666666-0000-0000-0000-000000000001',
    'Pemberitahuan Pelaksanaan Manasik Akbar Batch Syawal 1448H',
    'Assalamu''alaikum Wr. Wb. Diberitahukan kepada seluruh calon jamaah Umroh Syawal bahwa Manasik Akbar akan diselenggarakan pada hari Ahad, 18 Oktober 2026 di Masjid Agung Al-Azhar, Kebayoran Baru, Jakarta Selatan. Jamaah diwajibkan membawa buku panduan manasik, mengenakan seragam batik travel, dan hadir tepat waktu pukul 07.30 WIB.',
    'all',
    true,
    timezone('utc'::text, now() - interval '2 days')
  ),
  (
    'f6666666-0000-0000-0000-000000000002',
    'Instruksi Pengumpulan Berkas Paspor Fisik & Vaksin Meningitis (H-21)',
    'Kepada seluruh Mitra Agen dan Calon Jamaah, mohon pastikan berkas paspor asli jamaah dengan masa berlaku minimal 8 bulan telah diserahkan ke kantor pusat atau kantor cabang terdekat paling lambat H-21 sebelum tanggal keberangkatan untuk proses validasi visa umroh dan ticketing.',
    'agents',
    true,
    timezone('utc'::text, now() - interval '5 days')
  )
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  target_audience = excluded.target_audience,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

-- ------------------------------------------------------------------------------
-- 7. BOOKINGS (5 Booking Sample yang Connect ke Jamaah yang Ada)
-- ------------------------------------------------------------------------------
insert into public.bookings (id, pilgrim_id, package_id, booking_date, departure_date, return_date, status, total_price)
values
  (
    '77777777-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111101', -- YUSHAN THORIQ ZHAFIF AL-HAKIM
    'a1111111-0000-0000-0000-000000000001', -- Reguler 9 Hari
    current_date - 15,
    current_date + 20,
    current_date + 29,
    'confirmed',
    29500000.00
  ),
  (
    '77777777-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111102', -- Yushan Thoriq
    'a1111111-0000-0000-0000-000000000001', -- Reguler 9 Hari
    current_date - 10,
    current_date + 20,
    current_date + 29,
    'pending',
    29500000.00
  ),
  (
    '77777777-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111103', -- Yushan Hakim
    'a1111111-0000-0000-0000-000000000002', -- Plus Turki 12 Hari
    current_date - 8,
    current_date + 35,
    current_date + 47,
    'confirmed',
    36500000.00
  ),
  (
    '77777777-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111104', -- Ahmad Fauzi
    'a1111111-0000-0000-0000-000000000001', -- Reguler 9 Hari
    current_date - 12,
    current_date + 20,
    current_date + 29,
    'confirmed',
    29500000.00
  ),
  (
    '77777777-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111105', -- Budi Santoso
    'a1111111-0000-0000-0000-000000000003', -- VIP Ramadhan 14 Hari
    current_date - 3,
    current_date + 45,
    current_date + 59,
    'pending',
    55000000.00
  )
on conflict (id) do update set
  pilgrim_id = excluded.pilgrim_id,
  package_id = excluded.package_id,
  booking_date = excluded.booking_date,
  departure_date = excluded.departure_date,
  return_date = excluded.return_date,
  status = excluded.status,
  total_price = excluded.total_price;
