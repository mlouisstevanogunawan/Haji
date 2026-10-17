-- ==============================================================================
-- Migration: Sinkronisasi Skema + RLS untuk Form CRUD (2026-10-17)
-- ==============================================================================
-- Jalankan file ini utuh di Supabase SQL Editor. Idempotent (aman dijalankan
-- berulang kali).
--
-- Masalah yang dibereskan:
--  1. Kolom yang dikirim form tapi tidak ada di tabel -> INSERT gagal senyap.
--  2. profiles tidak punya kolom data jamaah (gender/NIK/paspor/cabang/status).
--  3. Tabel yang dipakai kode tapi belum pernah dibuat (equipment_assignments).
--  4. Referensi relasi agen/muthawif di bookings belum ada.
--  5. Definisi branches ganda (2 versi migration) -> kolom dilicinkan.
--  6. RLS: tidak ada policy INSERT/DELETE untuk profiles, dan policy tulis
--     belum dipisah per role (Admin / Agen / Muthawif / Jamaah).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. profiles: lengkapi kolom yang dipakai form Tambah/Edit Jamaah & Pengguna
-- ------------------------------------------------------------------------------
-- phone / is_active / branch_id sudah pernah ditambahkan add_users_management.sql,
-- diulang di sini dengan IF NOT EXISTS agar aman bila migration itu belum jalan.
alter table public.profiles
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists phone text,
  add column if not exists agent_code text,
  add column if not exists gender text check (gender in ('Laki-laki', 'Perempuan')),
  add column if not exists nik text,
  add column if not exists passport_number text,
  add column if not exists passport_expiry date,
  add column if not exists status text not null default 'Aktif',
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists birth_place text,
  add column if not exists birth_date date,
  add column if not exists blood_type text,
  add column if not exists passport_issue_place text,
  add column if not exists passport_issue_date date,
  add column if not exists mahram_name text,
  add column if not exists mahram_relation text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists health_notes text;

create index if not exists idx_profiles_branch_id on public.profiles(branch_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_active on public.profiles(is_active);
create index if not exists idx_profiles_agent_code on public.profiles(agent_code);

-- ------------------------------------------------------------------------------
-- 2. branches: samakan dua versi definisi (city/phone/email/is_headquarter)
-- ------------------------------------------------------------------------------
alter table public.branches
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists is_headquarter boolean not null default false;

-- ------------------------------------------------------------------------------
-- 3. bookings: relasi agen & muthawif (dibaca dashboard Mitra Agen & Muthawif)
-- ------------------------------------------------------------------------------
alter table public.bookings
  add column if not exists agent_id uuid references public.agents(id) on delete set null,
  add column if not exists guide_id uuid references public.guides(id) on delete set null,
  add column if not exists invoice_number text,
  add column if not exists notes text;

create index if not exists idx_bookings_agent_id on public.bookings(agent_id);
create index if not exists idx_bookings_guide_id on public.bookings(guide_id);

-- ------------------------------------------------------------------------------
-- 4. packages: kolom yang dikirim form Tambah/Edit Paket
--    Tanpa kolom ini, input "Kode", "Cabang", "Uang Muka", "Tanggal Berangkat",
--    "Kota Berangkat", "Fasilitas Tidak Termasuk" dan "Maskapai" hilang
--    diam-diam saat Simpan karena hanya 7 field yang dipetakan ke INSERT.
-- ------------------------------------------------------------------------------
alter table public.packages
  add column if not exists departure_date date,
  add column if not exists airline text,
  add column if not exists code text,
  add column if not exists down_payment numeric(15, 2),
  add column if not exists departure_city text,
  add column if not exists facilities_excluded text[] default '{}',
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

create index if not exists idx_packages_branch_id on public.packages(branch_id);
create index if not exists idx_packages_departure_date on public.packages(departure_date);

-- ------------------------------------------------------------------------------
-- 5. hotels / flights / guides / agents: kolom pelengkap yang dikirim form
-- ------------------------------------------------------------------------------
alter table public.hotels
  add column if not exists star_rating numeric(2, 1),
  add column if not exists distance_to_haram text,
  add column if not exists description text,
  add column if not exists is_active boolean not null default true;

alter table public.flights
  add column if not exists flight_number text,
  add column if not exists is_active boolean not null default true;

alter table public.agents
  add column if not exists code text unique,
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists city text;

alter table public.guides
  add column if not exists code text unique,
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists gender text,
  add column if not exists specialization text,
  add column if not exists bio text;

-- ------------------------------------------------------------------------------
-- 6. equipment_assignments: tabel baru (dibaca dashboard, belum pernah dibuat)
-- ------------------------------------------------------------------------------
create table if not exists public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.equipment(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete cascade,
  pilgrim_id uuid references public.profiles(id) on delete cascade,
  pilgrim_name text,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  condition public.equipment_condition not null default 'good',
  is_delivered boolean not null default false,
  delivered_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.equipment_assignments enable row level security;

create index if not exists idx_equipment_assignments_booking
  on public.equipment_assignments(booking_id);
create index if not exists idx_equipment_assignments_pilgrim
  on public.equipment_assignments(pilgrim_id);

-- ------------------------------------------------------------------------------
-- 7. documents: kolom pelengkap form Dokumen & Paspor
-- ------------------------------------------------------------------------------
alter table public.documents
  add column if not exists pilgrim_name text,
  add column if not exists document_status_note text;

-- ------------------------------------------------------------------------------
-- 7b. Kolom hasil audit form gelombang kedua (2026-10-17)
--     Tiap kolom di bawah ini adalah input yang sudah ada di form tapi dulu
--     hilang diam-diam waktu Simpan karena tabelnya belum punya tempat menaruh.
-- ------------------------------------------------------------------------------
alter table public.announcements
  add column if not exists branch_id uuid references public.branches(id) on delete cascade,
  add column if not exists package_id uuid references public.packages(id) on delete cascade,
  add column if not exists expires_at timestamp with time zone;

alter table public.equipment_assignments
  add column if not exists size text;

-- Form manasik mengizinkan lokasi kosong; kolom NOT NULL sebelumnya membuat
-- INSERT gagal total hanya karena satu field opsional tidak diisi.
alter table public.manasik_sessions
  alter column location drop not null;

alter table public.system_settings
  add column if not exists subtitle text,
  add column if not exists footer_text text,
  add column if not exists primary_color text,
  add column if not exists secondary_color text,
  add column if not exists logo_url text,
  add column if not exists favicon_url text;

-- ------------------------------------------------------------------------------
-- 8. Trigger updated_at universal (idempotent)
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','branches','bank_accounts','packages','hotels','flights','guides',
    'agents','bookings','documents','equipment','announcements','commissions',
    'invoices','manasik_sessions','manasik_attendance','system_settings',
    'equipment_assignments'
  ]
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t
        and column_name = 'updated_at'
    ) then
      execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
      execute format(
        'create trigger trg_%s_updated_at before update on public.%I '
        || 'for each row execute procedure public.handle_updated_at()', t, t
      );
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------------------------
-- 9. RLS: helper role yang tahan-banting
-- ------------------------------------------------------------------------------
-- is_admin() sudah ada di 20261007. Kami perluas daftarnya agar role yang
-- dipakai kode (admin_operasional, superadmin, agen, muthawif) dikenali.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() ->> 'role' = 'service_role',
    false
  ) or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','super_admin','admin_cabang','superadmin','admin_operasional')
  );
$$;

-- Helper baru: role manajerial (agen/muthawif) yang boleh menulis data miliknya
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid() limit 1;
$$;

-- ------------------------------------------------------------------------------
-- 10. RLS policies: tulis (INSERT/UPDATE/DELETE) dipisah per jenis akses
-- ------------------------------------------------------------------------------
-- CATATAN PENTING.
-- Aplikasi ini saat ini TIDAK memakai Supabase Auth asli; login hanya set cookie
-- demo `umroh_admin_session`, sehingga auth.uid() = NULL dan role JWT = 'anon'.
-- Karena itu policy di bawah (yang bergantung auth.uid()) belum bisa dipenuhi
-- browser. Seluruh tulis-form diarahkan lewat /api/db yang memakai SERVICE ROLE
-- (bypass RLS) — itulah yang membuat data benar-benar masuk sekarang.
-- Policy ini tetap ditulis benar supaya begitu auth asli aktif, semuanya jalan
-- tanpa perubahan lagi, dan service_role selalu punya jalan pintas.

-- 10.1 profiles: sebelumnya TIDAK punya policy INSERT/DELETE sama sekali.
drop policy if exists "service_role full profiles" on public.profiles;
create policy "service_role full profiles"
  on public.profiles for all
  to service_role
  using (true) with check (true);

drop policy if exists "admins manage all profiles" on public.profiles;
create policy "admins manage all profiles"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  to authenticated, anon
  with check (id = auth.uid() or public.is_admin());

-- 10.2 Tabel master/operasional: hanya admin (via service_role atau auth asli).
do $$
declare
  t text;
begin
  foreach t in array array[
    'branches','bank_accounts','packages','hotels','flights','guides','agents',
    'equipment','equipment_assignments','manasik_sessions','system_settings',
    'announcements','commissions'
  ]
  loop
    execute format('drop policy if exists "%s_service_role_write" on public.%I', t, t);
    execute format(
      'create policy "%s_service_role_write" on public.%I for all to service_role '
      || 'using (true) with check (true)', t, t
    );

    execute format('drop policy if exists "%s_admin_write" on public.%I', t, t);
    execute format(
      'create policy "%s_admin_write" on public.%I for all to authenticated '
      || 'using (public.is_admin()) with check (public.is_admin())', t, t
    );
  end loop;
end $$;

-- 10.3 bookings: admin penuh; agen boleh tulis booking miliknya sendiri.
drop policy if exists "bookings_service_role_write" on public.bookings;
create policy "bookings_service_role_write"
  on public.bookings for all
  to service_role
  using (true) with check (true);

drop policy if exists "bookings_admin_write" on public.bookings;
create policy "bookings_admin_write"
  on public.bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "agents manage own bookings" on public.bookings;
create policy "agents manage own bookings"
  on public.bookings for all
  to authenticated
  using (
    exists (
      select 1 from public.agents a
      join public.profiles p on p.id = a.user_id
      where a.id = bookings.agent_id and p.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.agents a
      join public.profiles p on p.id = a.user_id
      where a.id = bookings.agent_id and p.id = auth.uid()
    )
  );

-- 10.4 invoices / payments: jamaah boleh baca & tulis untuk tagihannya sendiri.
drop policy if exists "invoices_service_role_write" on public.invoices;
create policy "invoices_service_role_write"
  on public.invoices for all
  to service_role
  using (true) with check (true);

drop policy if exists "invoices_admin_write" on public.invoices;
create policy "invoices_admin_write"
  on public.invoices for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "payments_service_role_write" on public.payments;
create policy "payments_service_role_write"
  on public.payments for all
  to service_role
  using (true) with check (true);

-- 10.5 Baca (SELECT) tabel katalog/operasional tanpa data pribadi.
-- Policy lama memakai `is_active = true or public.is_admin()`. Dengan sesi demo,
-- is_admin() selalu false sehingga baris non-aktif (draft) tidak pernah muncul di
-- daftar admin: data tersimpan tapi tidak terlihat. Read policy berikut membuka
-- SELECT untuk katalog (harga paket, hotel, penerbangan, cabang, rekening, agen,
-- muthawif, perlengkapan, pengumuman, manasik) tanpa membuka tabel berisi data
-- jamaah (profiles, bookings, documents, invoices, payments, commissions,
-- activity_logs) — tabel itu tetap dibaca lewat /api/db.
do $$
declare
  t text;
begin
  foreach t in array array[
    'branches','bank_accounts','packages','hotels','flights','guides','agents',
    'equipment','announcements','manasik_sessions','system_settings'
  ]
  loop
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format(
      'create policy "%s_read" on public.%I for select to authenticated, anon using (true)',
      t, t
    );
  end loop;

  -- manasik_attendance berisi nama & NIK jamaah, jadi tidak dibuka untuk anon.
  -- Semua aksennya sudah lewat /api/db (service_role), policy lama dihapus.
  execute 'drop policy if exists "manasik_attendance_read" on public.manasik_attendance';
end $$;

-- profiles: daftar jamaah/agen dibutuhkan banyak halaman. Policy lama menuntut
-- auth.uid() = id sehingga kosong total di sesi demo. SELECT dibatasi pada kolom
-- yang memang dipakai UI lewat proxy; di sini hanya dibuka untuk authenticated
-- (bukan anon) agar halaman profil dasar tetap berfungsi bila auth asli aktif.
drop policy if exists "profiles_read_for_app" on public.profiles;
create policy "profiles_read_for_app"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. Backfill: pastikan kolom label yang dipakai UI tagihan punya nilai wajar
-- ------------------------------------------------------------------------------
update public.profiles set status = 'Aktif' where status is null;
update public.profiles set is_active = true where is_active is null;
