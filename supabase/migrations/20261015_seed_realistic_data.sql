-- ============================================================================
-- Migration: Seed realistic operational data for Al-Madinah Travel (umroh/haji)
-- Date: 2026-10-15
-- Idempotent: ON CONFLICT DO NOTHING / DO UPDATE. Deterministic UUIDs keep FKs valid.
-- UUID scheme (valid hex):
--   profiles/auth.users 10000000-..  packages 20..  hotels 30..  flights 40..
--   equipment 50..  guides 60..  agents 70..  bookings 80..  invoices 90..
--   payments a0..  commissions b0..  documents c0..  announcements d0..
--   manasik_sessions e0..  manasik_attendance f0..  bank_accounts 0a..  activity_logs 0b..
-- All demo users share password: Praktik123!  (bcrypt, email auto-confirmed)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. AUTH USERS (20) — required because profiles.id FK -> auth.users
--    handle_new_user trigger auto-creates a profiles row; step 2 enriches it.
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','fauzan.ahmad@almadinahtravel.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Ahmad Fauzan'), now(), now()),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','siti.nurhaliza@almadinahtravel.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Siti Nurhaliza'), now(), now()),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','bambang.sutrisno@almadinahtravel.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Bambang Sutrisno'), now(), now()),
  ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','abdul.rahman@almadinahtravel.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Abdul Rahman'), now(), now()),
  ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','maryam.abdullah@almadinahtravel.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Maryam Abdullah'), now(), now()),
  ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','dewi.lestari@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Dewi Lestari'), now(), now()),
  ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','agus.salim@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Agus Salim'), now(), now()),
  ('10000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ratna.juwita@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Ratna Juwita'), now(), now()),
  ('10000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','hendra.wijaya@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Hendra Wijaya'), now(), now()),
  ('10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','fitri.handayani@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Fitri Handayani'), now(), now()),
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','joko.prasetyo@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Joko Prasetyo'), now(), now()),
  ('10000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','nur.aisyah@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Nur Aisyah'), now(), now()),
  ('10000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','slamet.riyadi@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Slamet Riyadi'), now(), now()),
  ('10000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated','wulan.dari@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Wulan Dari'), now(), now()),
  ('10000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rudi.hartono@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Rudi Hartono'), now(), now()),
  ('10000000-0000-0000-0000-000000000016','00000000-0000-0000-0000-000000000000','authenticated','authenticated','maya.sari@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Maya Sari'), now(), now()),
  ('10000000-0000-0000-0000-000000000017','00000000-0000-0000-0000-000000000000','authenticated','authenticated','andi.gunawan@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Andi Gunawan'), now(), now()),
  ('10000000-0000-0000-0000-000000000018','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sari.amalia@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Sari Amalia'), now(), now()),
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teguh.prakoso@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Teguh Prakoso'), now(), now()),
  ('10000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lina.marlina@gmail.com','$2b$10$0kWWKM0.2dzoH9bQ8UaX.OAWjDNPBPAwEc1Ls7tMqG7C4Djjx/lXK', now(), jsonb_build_object('full_name','Lina Marlina'), now(), now())
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. PROFILES (20) — 5 staff/admin, 15 jamaah. Enrich rows created by trigger.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, role, branch_id, phone, is_active, avatar_url)
values
  ('10000000-0000-0000-0000-000000000001','fauzan.ahmad@almadinahtravel.com','Ahmad Fauzan','super_admin',(select id from public.branches where code='JKT'),'0812-1234-5678',true,null),
  ('10000000-0000-0000-0000-000000000002','siti.nurhaliza@almadinahtravel.com','Siti Nurhaliza','admin_cabang',(select id from public.branches where code='BDG'),'0813-2233-4455',true,null),
  ('10000000-0000-0000-0000-000000000003','bambang.sutrisno@almadinahtravel.com','Bambang Sutrisno','admin_cabang',(select id from public.branches where code='SBY'),'0811-9988-7766',true,null),
  ('10000000-0000-0000-0000-000000000004','abdul.rahman@almadinahtravel.com','Abdul Rahman','muthawif',(select id from public.branches where code='JKT'),'0812-3456-7890',true,null),
  ('10000000-0000-0000-0000-000000000005','maryam.abdullah@almadinahtravel.com','Maryam Abdullah','muthawif',(select id from public.branches where code='JKT'),'0815-6789-1234',true,null),
  ('10000000-0000-0000-0000-000000000006','dewi.lestari@gmail.com','Dewi Lestari','jamaah',(select id from public.branches where code='JKT'),'0812-2233-1144',true,null),
  ('10000000-0000-0000-0000-000000000007','agus.salim@gmail.com','Agus Salim','jamaah_umroh',(select id from public.branches where code='BDG'),'0813-1122-3344',true,null),
  ('10000000-0000-0000-0000-000000000008','ratna.juwita@gmail.com','Ratna Juwita','jamaah_umroh',(select id from public.branches where code='SBY'),'0811-4455-6677',true,null),
  ('10000000-0000-0000-0000-000000000009','hendra.wijaya@gmail.com','Hendra Wijaya','jamaah',(select id from public.branches where code='JKT'),'0812-7788-9900',true,null),
  ('10000000-0000-0000-0000-000000000010','fitri.handayani@gmail.com','Fitri Handayani','jamaah_umroh',(select id from public.branches where code='BDG'),'0813-5566-7788',true,null),
  ('10000000-0000-0000-0000-000000000011','joko.prasetyo@gmail.com','Joko Prasetyo','jamaah',(select id from public.branches where code='SBY'),'0811-2244-6688',true,null),
  ('10000000-0000-0000-0000-000000000012','nur.aisyah@gmail.com','Nur Aisyah','jamaah_umroh',(select id from public.branches where code='JKT'),'0812-3355-7799',true,null),
  ('10000000-0000-0000-0000-000000000013','slamet.riyadi@gmail.com','Slamet Riyadi','jamaah',(select id from public.branches where code='BDG'),'0813-4466-8800',true,null),
  ('10000000-0000-0000-0000-000000000014','wulan.dari@gmail.com','Wulan Dari','jamaah_umroh',(select id from public.branches where code='SBY'),'0811-5577-9911',true,null),
  ('10000000-0000-0000-0000-000000000015','rudi.hartono@gmail.com','Rudi Hartono','jamaah',(select id from public.branches where code='JKT'),'0812-6688-1133',true,null),
  ('10000000-0000-0000-0000-000000000016','maya.sari@gmail.com','Maya Sari','jamaah_umroh',(select id from public.branches where code='BDG'),'0813-7799-2244',true,null),
  ('10000000-0000-0000-0000-000000000017','andi.gunawan@gmail.com','Andi Gunawan','jamaah',(select id from public.branches where code='SBY'),'0811-8800-3355',true,null),
  ('10000000-0000-0000-0000-000000000018','sari.amalia@gmail.com','Sari Amalia','jamaah_umroh',(select id from public.branches where code='JKT'),'0812-9911-4466',true,null),
  ('10000000-0000-0000-0000-000000000019','teguh.prakoso@gmail.com','Teguh Prakoso','jamaah',(select id from public.branches where code='BDG'),'0813-1133-5577',true,null),
  ('10000000-0000-0000-0000-000000000020','lina.marlina@gmail.com','Lina Marlina','jamaah_umroh',(select id from public.branches where code='SBY'),'0811-2244-8800',true,null)
on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      branch_id = excluded.branch_id,
      phone = excluded.phone,
      is_active = excluded.is_active,
      updated_at = timezone('utc'::text, now());

-- ---------------------------------------------------------------------------
-- 3. BANK ACCOUNTS (4)
-- ---------------------------------------------------------------------------
insert into public.bank_accounts (id, bank_name, branch_name, account_number, account_holder, office_branch, is_active) values
  ('0a000000-0000-0000-0000-000000000001','Bank BCA','KCU Sudirman','1260388899','PT Al-Madinah Wisata Syariah','Jl. Jend. Sudirman Kav.22, Jakarta',true),
  ('0a000000-0000-0000-0000-000000000002','Bank Mandiri','KCU Melawai','1890067890123','PT Al-Madinah Wisata Syariah','Jl. Melawai Raya No.10, Jakarta Selatan',true),
  ('0a000000-0000-0000-0000-000000000003','Bank BNI','KCN Dago','0350887766','PT Al-Madinah Wisata Syariah','Jl. Ir. H. Juanda No.88, Bandung',true),
  ('0a000000-0000-0000-0000-000000000004','Bank Syariah Indonesia','KCP Basra','7654321100','PT Al-Madinah Wisata Syariah','Jl. Basuki Rahmat No.45, Surabaya',true)
on conflict (account_number) do nothing;

-- ---------------------------------------------------------------------------
-- 4. PACKAGES (8) — mix umroh reguler/plus & haji. prices in IDR.
-- ---------------------------------------------------------------------------
insert into public.packages (id, name, type, price, duration_days, quota, facilities, description, is_active) values
  ('20000000-0000-0000-0000-000000000001','Umroh Reguler 9 Hari','umroh',28500000,9,45,
    array['Hotel dekat Haram','Tiket PP','Visa','Konsumsi 3x','Muthawif','Transport AC'],
    'Paket umroh reguler 9 hari dengan akomodasi hotel berbintang dan pembimbing berpengalaman.',true),
  ('20000000-0000-0000-0000-000000000002','Umroh Reguler 12 Hari','umroh',34000000,12,40,
    array['Hotel dekat Haram','Tiket PP','Visa','Konsumsi 3x','Muthawif','City Tour Makkah-Madinah'],
    'Umroh 12 hari dengan durasi lebih lama di Tanah Suci dan city tour lengkap.',true),
  ('20000000-0000-0000-0000-000000000003','Umroh Plus Turki 12 Hari','umroh',39500000,12,30,
    array['Hotel dekat Haram','Tiket PP','Visa','Konsumsi 3x','Muthawif','Wisata Istanbul'],
    'Umroh dipadukan wisata Istanbul, Hagia Sophia, dan Blue Mosque.',true),
  ('20000000-0000-0000-0000-000000000004','Umroh Ramadhan 14 Hari','umroh',44000000,14,25,
    array['Hotel dekat Haram','Tiket PP','Visa','Konsumsi 3x','Muthawif','Iftar Bareng','Peringatan Nuzulul Quran'],
    'Umroh spesial bulan Ramadhan dengan keberangkatan awal dan ibadah full di Tanah Suci.',true),
  ('20000000-0000-0000-0000-000000000005','Haji Reguler 2026','haji',65000000,40,20,
    array['Biaya Perkim','Tiket PP','Konsumsi','Maktab','Pembimbing Haji'],
    'Paket haji reguler keberangkatan 2026 sesuai kuota Kementerian Agama.',true),
  ('20000000-0000-0000-0000-000000000006','Haji Khusus 2026','haji',95000000,30,15,
    array['Hotel Bintang 5','Tiket PP Bisnis','Konsumsi 3x','Muthawif Privat','Tanpa Waiting List'],
    'Haji khusus dengan jadwal lebih cepat, hotel premium, dan layanan privat.',true),
  ('20000000-0000-0000-0000-000000000007','Umroh Plus Thaif 10 Hari','umroh',36000000,10,35,
    array['Hotel dekat Haram','Tiket PP','Visa','Konsumsi 3x','Muthawif','Wisata Thaif'],
    'Umroh dengan tambahan wisata kota Thaif, kebun mawar, dan istana Shifa.',true),
  ('20000000-0000-0000-0000-000000000008','Umroh Hemat 8 Hari','umroh',25000000,8,50,
    array['Hotel Bintang 3','Tiket PP','Visa','Konsumsi 2x','Muthawif'],
    'Paket umroh ekonomis 8 hari untuk jamaah dengan budget terbatas.',true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. HOTELS (6) — makkah & madinah
-- ---------------------------------------------------------------------------
insert into public.hotels (id, name, city, address, rating, price_per_night, photo_url) values
  ('30000000-0000-0000-0000-000000000001','Swissotel Al Masar Makkah','makkah','King Abdulaziz Gateway Rd, Makkah',5,2200000,null),
  ('30000000-0000-0000-0000-000000000002','Makkah Hilton Towers','makkah','Abraj Al Bait, Front Haram, Makkah',5,2650000,null),
  ('30000000-0000-0000-0000-000000000003','Pullman Zamzam Makkah','makkah','Ibrahim Al Khalil Rd, Makkah',4,1850000,null),
  ('30000000-0000-0000-0000-000000000004','Anwar Al Madinah Movenpick','madinah','King Fahd Rd, Al Mansourah, Madinah',5,1750000,null),
  ('30000000-0000-0000-0000-000000000005','Al Eiman Royal Hotel Madinah','madinah','Bab Jibril Area, Madinah',4,1400000,null),
  ('30000000-0000-0000-0000-000000000006','Frontel Al Noor Madinah','madinah','Near Haram Sharif, Madinah',4,1550000,null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. FLIGHTS (6) — CGK-JED/MED routes
-- ---------------------------------------------------------------------------
insert into public.flights (id, airline_code, airline_name, route) values
  ('40000000-0000-0000-0000-000000000001','SV','Saudia','CGK - JED'),
  ('40000000-0000-0000-0000-000000000002','GA','Garuda Indonesia','CGK - JED'),
  ('40000000-0000-0000-0000-000000000003','EK','Emirates','CGK - DXB - JED'),
  ('40000000-0000-0000-0000-000000000004','QR','Qatar Airways','CGK - DOH - MED'),
  ('40000000-0000-0000-0000-000000000005','FZ','flydubai','CGK - DXB - JED'),
  ('40000000-0000-0000-0000-000000000006','OD','Batik Air Malaysia','CGK - KUL - MED')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. EQUIPMENT (10)
-- ---------------------------------------------------------------------------
insert into public.equipment (id, name, category, quantity, condition) values
  ('50000000-0000-0000-0000-000000000001','Koper Kabin Umroh','Akomodasi',200,'good'),
  ('50000000-0000-0000-0000-000000000002','Ihram Pria','Pakaian',180,'good'),
  ('50000000-0000-0000-0000-000000000003','Mukena Perempuan','Pakaian',175,'good'),
  ('50000000-0000-0000-0000-000000000004','Gelang Identitas Jamaah','Atribut',320,'good'),
  ('50000000-0000-0000-0000-000000000005','Name Tag Peserta','Atribut',300,'good'),
  ('50000000-0000-0000-0000-000000000006','Pouch Paspor','Dokumen',290,'good'),
  ('50000000-0000-0000-0000-000000000007','Payung Lipat','Perlengkapan',60,'damaged'),
  ('50000000-0000-0000-0000-000000000008','Termos Minum','Perlengkapan',140,'good'),
  ('50000000-0000-0000-0000-000000000009','Masker Kesehatan','Kesehatan',90,'good'),
  ('50000000-0000-0000-0000-000000000010','Hand Sanitizer','Kesehatan',25,'lost')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 8. GUIDES (4) — muthawif linked to profiles where available
-- ---------------------------------------------------------------------------
insert into public.guides (id, name, user_id, email, phone, experience_years, language_skills, is_active) values
  ('60000000-0000-0000-0000-000000000001','Abdul Rahman','10000000-0000-0000-0000-000000000004','abdul.rahman@almadinahtravel.com','0812-3456-7890',8,array['Indonesia','Arab','Inggris'],true),
  ('60000000-0000-0000-0000-000000000002','Maryam Abdullah','10000000-0000-0000-0000-000000000005','maryam.abdullah@almadinahtravel.com','0815-6789-1234',6,array['Indonesia','Arab'],true),
  ('60000000-0000-0000-0000-000000000003','Zubir Hasan',null,'zubir.hasan@muthawif.id','0817-2233-8899',11,array['Indonesia','Arab','Inggris','Jawa'],true),
  ('60000000-0000-0000-0000-000000000004','Halimah Saad',null,'halimah.saad@muthawif.id','0818-4455-9900',5,array['Indonesia','Arab','Sunda'],false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 9. AGENTS (5) — mitra agen
-- ---------------------------------------------------------------------------
insert into public.agents (id, name, user_id, email, phone, commission_rate, is_active) values
  ('70000000-0000-0000-0000-000000000001','Hendra Wijaya','10000000-0000-0000-0000-000000000009','hendra.wijaya@gmail.com','0812-7788-9900',0.05,true),
  ('70000000-0000-0000-0000-000000000002','Rudi Hartono','10000000-0000-0000-0000-000000000015','rudi.hartono@gmail.com','0812-6688-1133',0.05,true),
  ('70000000-0000-0000-0000-000000000003','Suwarti Mitra',null,'suwarti.agen@gmail.com','0813-9988-7766',0.04,true),
  ('70000000-0000-0000-0000-000000000004','Mulyadi Travel',null,'mulyadi.agen@gmail.com','0811-3322-1100',0.045,true),
  ('70000000-0000-0000-0000-000000000005','Endang Sulastri',null,'endang.s@gmail.com','0812-1100-2233',0.04,false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 10. SYSTEM SETTINGS — upsert default row (idempotent)
-- ---------------------------------------------------------------------------
insert into public.system_settings (id, travel_name, company_legal_name, ppiu_number, pihk_number,
  accreditation, established_year, support_phone, support_email, website_url, head_office_address,
  default_dp_amount, payment_due_days_before_departure, enable_midtrans_gateway, admin_fee_amount)
values ('default_settings','Al-Madinah Travel','PT Al-Madinah Wisata Syariah',
  'Kemenag RI No. U.412 Tahun 2021','Kemenag RI No. HK.108 Tahun 2023',
  'Akreditasi A (Sangat Baik)','2016','0812-9900-1122','layanan@almadinahtravel.com',
  'https://almadinahtravel.com','Jl. M.H. Thamrin No. 12, Menteng, Jakarta Pusat 10350',
  5000000,30,true,0)
on conflict (id) do update set
  travel_name = excluded.travel_name,
  updated_at = timezone('utc'::text, now());

-- ---------------------------------------------------------------------------
-- 11. BOOKINGS (15) — jamaah x package
-- ---------------------------------------------------------------------------
insert into public.bookings (id, pilgrim_id, package_id, booking_date, departure_date, return_date, status, total_price) values
  ('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001','2026-01-10','2026-03-15','2026-03-23','confirmed',28500000),
  ('80000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000003','2026-01-18','2026-04-02','2026-04-13','confirmed',39500000),
  ('80000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002','2026-02-01',null,null,'pending',34000000),
  ('80000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000008','2026-02-05','2026-05-10','2026-05-17','confirmed',25000000),
  ('80000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000005','2026-02-10',null,null,'confirmed',65000000),
  ('80000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000004','2025-12-20','2026-02-18','2026-03-03','completed',44000000),
  ('80000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000007','2026-02-22','2026-06-01','2026-06-10','confirmed',36000000),
  ('80000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000013','20000000-0000-0000-0000-000000000001','2026-03-01',null,null,'pending',28500000),
  ('80000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000014','20000000-0000-0000-0000-000000000006','2026-03-05',null,null,'confirmed',95000000),
  ('80000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000015','20000000-0000-0000-0000-000000000002','2026-03-12','2026-07-05','2026-07-16','confirmed',34000000),
  ('80000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000016','20000000-0000-0000-0000-000000000004','2026-03-18','2026-08-20','2026-09-02','confirmed',44000000),
  ('80000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000017','20000000-0000-0000-0000-000000000008','2026-03-25',null,null,'pending',25000000),
  ('80000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000018','20000000-0000-0000-0000-000000000005','2026-04-02',null,null,'confirmed',65000000),
  ('80000000-0000-0000-0000-000000000014','10000000-0000-0000-0000-000000000019','20000000-0000-0000-0000-000000000003','2025-11-15','2026-01-20','2026-01-31','completed',39500000),
  ('80000000-0000-0000-0000-000000000015','10000000-0000-0000-0000-000000000020','20000000-0000-0000-0000-000000000001','2026-04-10',null,null,'confirmed',28500000)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 12. INVOICES (15) — one per booking
-- ---------------------------------------------------------------------------
insert into public.invoices (id, invoice_number, booking_id, jamaah_id, type, amount, paid_amount, status, due_date, payment_date, payment_method, midtrans_order_id) values
  ('90000000-0000-0000-0000-000000000001','INV-2026-0001','80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','pelunasan',28500000,28500000,'paid','2026-03-01','2026-02-20','Transfer BCA','ORD-UMR-0001'),
  ('90000000-0000-0000-0000-000000000002','INV-2026-0002','80000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000007','dp',39500000,20000000,'partial','2026-03-20',null,'Transfer Mandiri','ORD-UMR-0002'),
  ('90000000-0000-0000-0000-000000000003','INV-2026-0003','80000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000008','dp',34000000,5000000,'partial','2026-04-15',null,'BSI Virtual Account','ORD-UMR-0003'),
  ('90000000-0000-0000-0000-000000000004','INV-2026-0004','80000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000009','pelunasan',25000000,25000000,'paid','2026-04-25','2026-04-10','Transfer BCA','ORD-UMR-0004'),
  ('90000000-0000-0000-0000-000000000005','INV-2026-0005','80000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000010','cicilan',65000000,25000000,'partial','2026-05-30',null,'Transfer Mandiri','ORD-HAJ-0005'),
  ('90000000-0000-0000-0000-000000000006','INV-2026-0006','80000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000011','pelunasan',44000000,44000000,'paid','2026-01-30','2026-01-15','Transfer BNI','ORD-UMR-0006'),
  ('90000000-0000-0000-0000-000000000007','INV-2026-0007','80000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000012','dp',36000000,10000000,'partial','2026-05-10',null,'Transfer BCA','ORD-UMR-0007'),
  ('90000000-0000-0000-0000-000000000008','INV-2026-0008','80000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000013','dp',28500000,0,'unpaid','2026-05-01',null,null,'ORD-UMR-0008'),
  ('90000000-0000-0000-0000-000000000009','INV-2026-0009','80000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000014','dp',95000000,40000000,'partial','2026-06-01',null,'Transfer Mandiri','ORD-HAJ-0009'),
  ('90000000-0000-0000-0000-000000000010','INV-2026-0010','80000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000015','pelunasan',34000000,34000000,'paid','2026-06-15','2026-05-20','Transfer BCA','ORD-UMR-0010'),
  ('90000000-0000-0000-0000-000000000011','INV-2026-0011','80000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000016','dp',44000000,15000000,'partial','2026-07-20',null,'BSI Virtual Account','ORD-UMR-0011'),
  ('90000000-0000-0000-0000-000000000012','INV-2026-0012','80000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000017','dp',25000000,0,'unpaid','2026-06-10',null,null,'ORD-UMR-0012'),
  ('90000000-0000-0000-0000-000000000013','INV-2026-0013','80000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000018','cicilan',65000000,30000000,'partial','2026-08-01',null,'Transfer Mandiri','ORD-HAJ-0013'),
  ('90000000-0000-0000-0000-000000000014','INV-2026-0014','80000000-0000-0000-0000-000000000014','10000000-0000-0000-0000-000000000019','pelunasan',39500000,39500000,'paid','2025-12-20','2025-12-05','Transfer BNI','ORD-UMR-0014'),
  ('90000000-0000-0000-0000-000000000015','INV-2026-0015','80000000-0000-0000-0000-000000000015','10000000-0000-0000-0000-000000000020','dp',28500000,10000000,'partial','2026-07-01',null,'Transfer BCA','ORD-UMR-0015')
on conflict (invoice_number) do nothing;

-- ---------------------------------------------------------------------------
-- 13. PAYMENTS (20) — some invoices have multiple installments
-- ---------------------------------------------------------------------------
insert into public.payments (id, invoice_id, order_id, transaction_id, transaction_status, payment_type, gross_amount, fraud_status, settlement_time, raw_response) values
  ('a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','PAY-2026-0001','TXN-2026-0001','settlement','bca_va',28500000,'accept','2026-02-20T09:12:00Z','{"channel":"bca_va","status":"settlement"}'),
  ('a0000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000002','PAY-2026-0002','TXN-2026-0002','settlement','bank_transfer',10000000,'accept','2026-02-22T10:30:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000002','PAY-2026-0003','TXN-2026-0003','settlement','bank_transfer',10000000,'accept','2026-03-10T14:05:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000003','PAY-2026-0004','TXN-2026-0004','settlement','bsi_va',5000000,'accept','2026-02-25T08:45:00Z','{"channel":"bsi_va"}'),
  ('a0000000-0000-0000-0000-000000000005','90000000-0000-0000-0000-000000000004','PAY-2026-0005','TXN-2026-0005','settlement','bca_va',25000000,'accept','2026-04-10T11:00:00Z','{"channel":"bca_va"}'),
  ('a0000000-0000-0000-0000-000000000006','90000000-0000-0000-0000-000000000005','PAY-2026-0006','TXN-2026-0006','settlement','bank_transfer',15000000,'accept','2026-03-15T09:20:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000007','90000000-0000-0000-0000-000000000005','PAY-2026-0007','TXN-2026-0007','settlement','bank_transfer',10000000,'accept','2026-04-18T13:40:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000008','90000000-0000-0000-0000-000000000006','PAY-2026-0008','TXN-2026-0008','settlement','bank_transfer',44000000,'accept','2026-01-15T10:00:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000009','90000000-0000-0000-0000-000000000007','PAY-2026-0009','TXN-2026-0009','settlement','bca_va',10000000,'accept','2026-03-20T15:10:00Z','{"channel":"bca_va"}'),
  ('a0000000-0000-0000-0000-000000000010','90000000-0000-0000-0000-000000000008','PAY-2026-0010','TXN-2026-0010','pending','bca_va',28500000,'challenge',null,'{"status":"pending"}'),
  ('a0000000-0000-0000-0000-000000000011','90000000-0000-0000-0000-000000000009','PAY-2026-0011','TXN-2026-0011','settlement','bank_transfer',20000000,'accept','2026-03-22T09:50:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000012','90000000-0000-0000-0000-000000000009','PAY-2026-0012','TXN-2026-0012','settlement','bank_transfer',20000000,'accept','2026-04-25T10:15:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000013','90000000-0000-0000-0000-000000000010','PAY-2026-0013','TXN-2026-0013','settlement','bca_va',34000000,'accept','2026-05-20T14:30:00Z','{"channel":"bca_va"}'),
  ('a0000000-0000-0000-0000-000000000014','90000000-0000-0000-0000-000000000011','PAY-2026-0014','TXN-2026-0014','settlement','bsi_va',15000000,'accept','2026-04-28T08:05:00Z','{"channel":"bsi_va"}'),
  ('a0000000-0000-0000-0000-000000000015','90000000-0000-0000-0000-000000000012','PAY-2026-0015','TXN-2026-0015','pending','bank_transfer',25000000,'challenge',null,'{"status":"pending"}'),
  ('a0000000-0000-0000-0000-000000000016','90000000-0000-0000-0000-000000000013','PAY-2026-0016','TXN-2026-0016','settlement','bank_transfer',15000000,'accept','2026-05-05T11:25:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000017','90000000-0000-0000-0000-000000000013','PAY-2026-0017','TXN-2026-0017','settlement','bank_transfer',15000000,'accept','2026-06-02T09:35:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000018','90000000-0000-0000-0000-000000000014','PAY-2026-0018','TXN-2026-0018','settlement','bank_transfer',39500000,'accept','2025-12-05T13:15:00Z','{"channel":"bank_transfer"}'),
  ('a0000000-0000-0000-0000-000000000019','90000000-0000-0000-0000-000000000015','PAY-2026-0019','TXN-2026-0019','settlement','bca_va',10000000,'accept','2026-04-30T10:50:00Z','{"channel":"bca_va"}'),
  ('a0000000-0000-0000-0000-000000000020','90000000-0000-0000-0000-000000000001','PAY-2026-0020','TXN-2026-0020','settlement','qris',0,'accept','2026-02-20T09:14:00Z','{"channel":"qris","note":"biaya admin"}')
on conflict (order_id) do nothing;

-- ---------------------------------------------------------------------------
-- 14. COMMISSIONS (8) — agent x booking, ~ commission_rate of price
-- ---------------------------------------------------------------------------
insert into public.commissions (id, agent_id, booking_id, amount, status, paid_at) values
  ('b0000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000004',1250000,'paid','2026-04-15T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001',1425000,'paid','2026-02-25T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000010',1700000,'pending',null),
  ('b0000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000002',1580000,'pending',null),
  ('b0000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000006',1760000,'paid','2026-01-20T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000013',2600000,'pending',null),
  ('b0000000-0000-0000-0000-000000000007','70000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000014',1580000,'cancelled',null),
  ('b0000000-0000-0000-0000-000000000008','70000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000011',1760000,'pending',null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 15. DOCUMENTS (25) — passport + visa + others per jamaah
-- ---------------------------------------------------------------------------
insert into public.documents (id, pilgrim_id, document_type, document_number, issue_date, expiry_date, status) values
  ('c0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','passport','C1234567','2024-01-15','2029-01-15','approved'),
  ('c0000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006','visa','VSA-8892011','2026-02-01','2026-08-01','approved'),
  ('c0000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000007','passport','C2345678','2023-06-20','2028-06-20','approved'),
  ('c0000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000007','vaccine_certificate','YC-2026-0044',null,null,'approved'),
  ('c0000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000008','passport','C3456789','2025-02-10','2026-02-10','pending'),
  ('c0000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000008','visa','VSA-8892033','2026-03-01','2026-09-01','pending'),
  ('c0000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000009','passport','C4567890','2022-11-05','2027-11-05','approved'),
  ('c0000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000009','visa','VSA-8892055','2026-03-15','2026-09-15','approved'),
  ('c0000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000010','passport','C5678901','2024-07-18','2029-07-18','approved'),
  ('c0000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000010','visa','VSA-8892066',null,null,'pending'),
  ('c0000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000011','passport','C6789012','2021-05-30','2026-05-30','rejected'),
  ('c0000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000011','vaccine_certificate','YC-2026-0112',null,null,'approved'),
  ('c0000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000012','passport','C7890123','2023-09-12','2028-09-12','approved'),
  ('c0000000-0000-0000-0000-000000000014','10000000-0000-0000-0000-000000000012','visa','VSA-8892077','2026-04-01','2026-10-01','approved'),
  ('c0000000-0000-0000-0000-000000000015','10000000-0000-0000-0000-000000000013','passport','C8901234','2024-03-22','2029-03-22','pending'),
  ('c0000000-0000-0000-0000-000000000016','10000000-0000-0000-0000-000000000013','other','KTP-3201-0013',null,null,'approved'),
  ('c0000000-0000-0000-0000-000000000017','10000000-0000-0000-0000-000000000014','passport','C9012345','2022-12-08','2027-12-08','approved'),
  ('c0000000-0000-0000-0000-000000000018','10000000-0000-0000-0000-000000000014','visa','VSA-8892088',null,null,'pending'),
  ('c0000000-0000-0000-0000-000000000019','10000000-0000-0000-0000-000000000015','passport','C0123456','2023-04-25','2028-04-25','approved'),
  ('c0000000-0000-0000-0000-000000000020','10000000-0000-0000-0000-000000000015','visa','VSA-8892099','2026-05-01','2026-11-01','approved'),
  ('c0000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000016','passport','C1357924','2024-08-14','2029-08-14','pending'),
  ('c0000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000017','vaccine_certificate','YC-2026-0217',null,null,'approved'),
  ('c0000000-0000-0000-0000-000000000023','10000000-0000-0000-0000-000000000018','passport','C2468135','2022-10-01','2027-10-01','approved'),
  ('c0000000-0000-0000-0000-000000000024','10000000-0000-0000-0000-000000000019','passport','C3579246','2023-01-19','2028-01-19','approved'),
  ('c0000000-0000-0000-0000-000000000025','10000000-0000-0000-0000-000000000020','passport','C4680257','2024-06-11','2029-06-11','pending')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 16. ANNOUNCEMENTS (6)
-- ---------------------------------------------------------------------------
insert into public.announcements (id, title, content, target_audience, is_published, published_at) values
  ('d0000000-0000-0000-0000-000000000001','Pengumuman Jadwal Manasik Utama Umroh Reguler 9 Hari',
   'Manasik utama akan dilaksanakan pada Sabtu, 15 Agustus 2026 pukul 09.00 WIB di Kantor Pusat Jakarta. Seluruh jamaah wajib hadir.','jamaah',true,'2026-07-01T08:00:00Z'),
  ('d0000000-0000-0000-0000-000000000002','Keberangkatan Umroh Ramadhan Batch 1 Dipercepat',
   'Jadwal keberangkatan batch 1 dimajukan menjadi 18 Februari 2026. Mohon jamaah menyiapkan dokumen lebih awal.','jamaah',true,'2025-12-20T08:00:00Z'),
  ('d0000000-0000-0000-0000-000000000003','Pelunasan Pembayaran H-30 Keberangkatan',
   'Pelunasan biaya umroh paling lambat 30 hari sebelum tanggal keberangkatan. Transfer ke rekening resmi Al-Madinah Travel.','jamaah',true,'2026-01-05T08:00:00Z'),
  ('d0000000-0000-0000-0000-000000000004','Rapat Koordinasi Muthawif & Pembimbing Haji',
   'Seluruh muthawif dan pembimbing hadir rapat koordinasi persiapan haji 2026 pada Rabu, 20 Mei 2026 di Kantor Pusat.','guides',true,'2026-05-05T08:00:00Z'),
  ('d0000000-0000-0000-0000-000000000005','Skema Komisi Mitra Agen Terbaru 2026',
   'Mulai kuartal ini, skema komisi mitra agen diubah menjadi sistem tier. Detail hubungi tim kemitraan Kantor Pusat.','agents',true,'2026-02-10T08:00:00Z'),
  ('d0000000-0000-0000-0000-000000000006','Draf: Sosialisasi Program Umroh Keluarga',
   'Rencana sosialisasi program umroh keluarga untuk kuartal depan. (Draft belum final)','all',false,null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 17. MANASIK SESSIONS (5)
-- ---------------------------------------------------------------------------
insert into public.manasik_sessions (id, title, package_id, session_date, session_time, location, muthawif_id, notes) values
  ('e0000000-0000-0000-0000-000000000001','Manasik Utama Umroh Reguler 9 Hari','20000000-0000-0000-0000-000000000001','2026-08-15','09:00:00','Aula Kantor Pusat Jakarta','10000000-0000-0000-0000-000000000004','Membawa buku panduan manasik'),
  ('e0000000-0000-0000-0000-000000000002','Manasik Umroh Ramadhan','20000000-0000-0000-0000-000000000004','2026-01-12','08:30:00','Aula Kantor Pusat Jakarta','10000000-0000-0000-0000-000000000004','Termasuk simulasi thawaf dan sa''i'),
  ('e0000000-0000-0000-0000-000000000003','Manasik Umroh Plus Turki','20000000-0000-0000-0000-000000000003','2026-03-02','09:00:00','Cabang Bandung','10000000-0000-0000-0000-000000000005','Briefing wisata Istanbul'),
  ('e0000000-0000-0000-0000-000000000004','Manasik Haji Reguler 2026','20000000-0000-0000-0000-000000000005','2026-05-18','08:00:00','Aula Kantor Pusat Jakarta','10000000-0000-0000-0000-000000000004','Manasik mandiri haji 40 hari'),
  ('e0000000-0000-0000-0000-000000000005','Manasik Umroh Hemat','20000000-0000-0000-0000-000000000008','2026-04-19','13:00:00','Cabang Surabaya','10000000-0000-0000-0000-000000000005','Sesi singkat khusus jamaah hemat')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 18. MANASIK ATTENDANCE (30) — jamaah per sesi
-- ---------------------------------------------------------------------------
insert into public.manasik_attendance (id, session_id, pilgrim_id, pilgrim_name, nik, status) values
  ('f0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','Dewi Lestari','3171014002850001','Hadir'),
  ('f0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000009','Hendra Wijaya','3171021203800002','Hadir'),
  ('f0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000012','Nur Aisyah','3171035504920003','Izin'),
  ('f0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000015','Rudi Hartono','3171042007880004','Hadir'),
  ('f0000000-0000-0000-0000-000000000005','e0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000018','Sari Amalia','3171051806950005','Hadir'),
  ('f0000000-0000-0000-0000-000000000006','e0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000020','Lina Marlina','3578022211900006','Alpa'),
  ('f0000000-0000-0000-0000-000000000007','e0000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000011','Joko Prasetyo','3578033008800007','Hadir'),
  ('f0000000-0000-0000-0000-000000000008','e0000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000016','Maya Sari','3204011506930008','Hadir'),
  ('f0000000-0000-0000-0000-000000000009','e0000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000010','Fitri Handayani','3204022807910009','Sakit'),
  ('f0000000-0000-0000-0000-000000000010','e0000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000007','Agus Salim','3204030509850010','Hadir'),
  ('f0000000-0000-0000-0000-000000000011','e0000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000013','Slamet Riyadi','3204041205780011','Hadir'),
  ('f0000000-0000-0000-0000-000000000012','e0000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000019','Teguh Prakoso','3204052504860012','Izin'),
  ('f0000000-0000-0000-0000-000000000013','e0000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000007','Agus Salim','3204030509850010','Hadir'),
  ('f0000000-0000-0000-0000-000000000014','e0000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000010','Fitri Handayani','3204022807910009','Hadir'),
  ('f0000000-0000-0000-0000-000000000015','e0000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000016','Maya Sari','3204011506930008','Hadir'),
  ('f0000000-0000-0000-0000-000000000016','e0000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000013','Slamet Riyadi','3204041205780011','Alpa'),
  ('f0000000-0000-0000-0000-000000000017','e0000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000019','Teguh Prakoso','3204052504860012','Hadir'),
  ('f0000000-0000-0000-0000-000000000018','e0000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Siti Nurhaliza','3204000101750013','Hadir'),
  ('f0000000-0000-0000-0000-000000000019','e0000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000010','Fitri Handayani','3204022807910009','Hadir'),
  ('f0000000-0000-0000-0000-000000000020','e0000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000014','Wulan Dari','3578041805920014','Hadir'),
  ('f0000000-0000-0000-0000-000000000021','e0000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000017','Andi Gunawan','3578050203840015','Izin'),
  ('f0000000-0000-0000-0000-000000000022','e0000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000011','Joko Prasetyo','3578033008800007','Hadir'),
  ('f0000000-0000-0000-0000-000000000023','e0000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000018','Sari Amalia','3171051806950005','Hadir'),
  ('f0000000-0000-0000-0000-000000000024','e0000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000006','Dewi Lestari','3171014002850001','Sakit'),
  ('f0000000-0000-0000-0000-000000000025','e0000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000009','Hendra Wijaya','3171021203800002','Hadir'),
  ('f0000000-0000-0000-0000-000000000026','e0000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000017','Andi Gunawan','3578050203840015','Hadir'),
  ('f0000000-0000-0000-0000-000000000027','e0000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000020','Lina Marlina','3578022211900006','Hadir'),
  ('f0000000-0000-0000-0000-000000000028','e0000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000008','Ratna Juwita','3578061004890016','Izin'),
  ('f0000000-0000-0000-0000-000000000029','e0000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000014','Wulan Dari','3578041805920014','Hadir'),
  ('f0000000-0000-0000-0000-000000000030','e0000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000012','Nur Aisyah','3171035504920003','Alpa')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 19. ACTIVITY LOGS (20) — audit trail admin/staff
-- ---------------------------------------------------------------------------
insert into public.activity_logs (id, user_id, action, description, ip_address, metadata) values
  ('0b000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','login','Ahmad Fauzan masuk ke dashboard sistem','103.28.15.10',null),
  ('0b000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','create_package','Paket Umroh Ramadhan 14 Hari ditambahkan','103.28.15.10',null),
  ('0b000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','create_booking','Booking baru jamaah Dewi Lestari untuk Umroh Reguler 9 Hari','180.244.30.7',null),
  ('0b000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','create_invoice','Invoice INV-2026-0001 dibuat','180.244.30.7',null),
  ('0b000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000003','create_booking','Booking baru jamaah Joko Prasetyo untuk Umroh Ramadhan','202.134.55.21',null),
  ('0b000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000003','update_payment_status','Pembayaran PAY-2026-0008 diverifikasi lunas','202.134.55.21',null),
  ('0b000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','approve_document','Dokumen paspor C1234567 (Dewi Lestari) disetujui','103.28.15.10',null),
  ('0b000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000002','reject_document','Dokumen paspor C6789012 (Joko Prasetyo) ditolak: hampir kedaluwarsa','180.244.30.7',null),
  ('0b000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000003','create_booking','Booking baru jamaah Slamet Riyadi untuk Umroh Reguler 9 Hari','202.134.55.21',null),
  ('0b000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000002','update_user_role','Peran Siti Nurhaliza diatur sebagai admin cabang Bandung','180.244.30.7',null),
  ('0b000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','create_announcement','Pengumuman jadwal manasik utama dipublikasikan','103.28.15.10',null),
  ('0b000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000004','conduct_manasik','Manasik Umroh Ramadhan sesi 1 selesai dilaksanakan','103.28.15.12',null),
  ('0b000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000002','create_agent','Mitra agen baru Suwarti Mitra ditambahkan','180.244.30.7',null),
  ('0b000000-0000-0000-0000-000000000014','10000000-0000-0000-0000-000000000003','create_commission','Komisi untuk mitra agen Hendra Wijaya dibuat','202.134.55.21',null),
  ('0b000000-0000-0000-0000-000000000015','10000000-0000-0000-0000-000000000001','update_settings','Pengaturan sistem default diperbarui','103.28.15.10',null),
  ('0b000000-0000-0000-0000-000000000016','10000000-0000-0000-0000-000000000002','mark_attendance','Absensi manasik sesi Umroh Reguler diperbarui','180.244.30.7',null),
  ('0b000000-0000-0000-0000-000000000017','10000000-0000-0000-0000-000000000003','create_invoice','Invoice INV-2026-0005 dibuat untuk Haji Reguler','202.134.55.21',null),
  ('0b000000-0000-0000-0000-000000000018','10000000-0000-0000-0000-000000000004','login','Abdul Rahman (muthawif) masuk ke modul manasik','103.28.15.12',null),
  ('0b000000-0000-0000-0000-000000000019','10000000-0000-0000-0000-000000000001','export_report','Laporan transaksi bulanan diekspor','103.28.15.10',null),
  ('0b000000-0000-0000-0000-000000000020','10000000-0000-0000-0000-000000000002','update_booking_status','Status booking Agus Salim diubah menjadi confirmed','180.244.30.7',null)
on conflict (id) do nothing;
