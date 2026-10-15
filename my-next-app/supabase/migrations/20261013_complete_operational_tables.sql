-- ==============================================================================
-- Migration: Complete Operational Database Tables for Umroh & Haji Management
-- Tables created:
-- 1. branches (Kantor Cabang)
-- 2. bank_accounts (Rekening Bank)
-- 3. activity_logs (Audit Trail Aktivitas)
-- 4. manasik_sessions (Sesi Jadwal Manasik)
-- 5. manasik_attendance (Absensi Kehadiran Jamaah Manasik)
-- 6. system_settings (Pengaturan Profil, Keuangan & Sistem)
-- RLS, Triggers, Indexes, and Initial Operational Records Included
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: branches (Kantor Cabang)
-- ------------------------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  code text unique not null,
  city text,
  address text,
  phone text,
  email text,
  is_headquarter boolean not null default false,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.branches enable row level security;

create policy "Anyone can view active branches"
  on public.branches for select
  using (is_active = true or public.is_admin());

create policy "Admins can manage branches"
  on public.branches for all
  using (public.is_admin());

create trigger trg_branches_updated_at
  before update on public.branches
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_branches_code on public.branches (code);
create index if not exists idx_branches_is_active on public.branches (is_active);

-- Seed branches
insert into public.branches (name, code, city, address, phone, email, is_headquarter, is_active)
values
  ('Kantor Pusat Jakarta', 'HO-JKT', 'Jakarta Pusat', 'Jl. M.H. Thamrin No. 12, Menteng', '021-3901234', 'pusat@almedinahtravel.com', true, true),
  ('Cabang Bandung', 'CAB-BDG', 'Bandung', 'Jl. Ir. H. Djuanda No. 88, Dago', '022-4209876', 'bandung@almedinahtravel.com', false, true),
  ('Cabang Jawa Timur Surabaya', 'SBY-01', 'Surabaya', 'Jl. Raya Darmo No. 45, Wonokromo', '031-87654321', 'sby@travelumroh.com', false, true)
on conflict (code) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  phone = excluded.phone,
  email = excluded.email;

-- ------------------------------------------------------------------------------
-- 2. Table: bank_accounts (Rekening Bank Resmi)
-- ------------------------------------------------------------------------------
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  branch_name text,
  account_number text not null,
  account_holder text not null,
  office_branch text default 'Kantor Pusat Jakarta',
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.bank_accounts enable row level security;

create policy "Anyone can view active bank accounts"
  on public.bank_accounts for select
  using (is_active = true or public.is_admin());

create policy "Admins can manage bank accounts"
  on public.bank_accounts for all
  using (public.is_admin());

create trigger trg_bank_accounts_updated_at
  before update on public.bank_accounts
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_bank_accounts_active on public.bank_accounts (is_active);

-- Seed bank accounts
insert into public.bank_accounts (bank_name, branch_name, account_number, account_holder, office_branch, is_active)
values
  ('Bank Mandiri', 'KCP Kebon Sirih Jakarta', '1230009876543', 'PT Al-Madinah Wisata Syariah', 'Kantor Pusat Jakarta', true),
  ('Bank Syariah Indonesia (BSI)', 'KCP Thamrin Jakarta', '7001234567', 'PT Al-Madinah Wisata Syariah', 'Kantor Pusat Jakarta', true),
  ('BCA Syariah', 'KCP Darmo Surabaya', '0112345678', 'PT Al-Madinah Wisata Syariah', 'Cabang Surabaya', true)
on conflict do nothing;

-- ------------------------------------------------------------------------------
-- 3. Table: activity_logs (Audit Trail Aktivitas)
-- ------------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  description text not null,
  ip_address text,
  metadata jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.activity_logs enable row level security;

create policy "Admins can view activity logs"
  on public.activity_logs for select
  using (public.is_admin() or auth.uid() = user_id);

create policy "Authenticated users can insert activity logs"
  on public.activity_logs for insert
  with check (auth.uid() is not null or public.is_admin());

create index if not exists idx_activity_logs_created_at on public.activity_logs (created_at desc);
create index if not exists idx_activity_logs_user_id on public.activity_logs (user_id);
create index if not exists idx_activity_logs_action on public.activity_logs (action);

-- ------------------------------------------------------------------------------
-- 4. Table: manasik_sessions (Sesi Jadwal Manasik)
-- ------------------------------------------------------------------------------
create table if not exists public.manasik_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  package_id uuid references public.packages(id) on delete set null,
  package_name text,
  session_date date not null,
  session_time text not null default '08:00 WIB',
  location text not null,
  muthawif_id uuid references public.guides(id) on delete set null,
  muthawif_name text,
  notes text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.manasik_sessions enable row level security;

create policy "Users can view manasik sessions"
  on public.manasik_sessions for select
  using (true);

create policy "Admins can manage manasik sessions"
  on public.manasik_sessions for all
  using (public.is_admin());

create trigger trg_manasik_sessions_updated_at
  before update on public.manasik_sessions
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Table: manasik_attendance (Absensi Jamaah Manasik)
-- ------------------------------------------------------------------------------
create table if not exists public.manasik_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.manasik_sessions(id) on delete cascade,
  pilgrim_id uuid references public.profiles(id) on delete cascade,
  pilgrim_name text not null,
  nik text,
  status text not null default 'Hadir',
  notes text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.manasik_attendance enable row level security;

create policy "Users can view manasik attendance"
  on public.manasik_attendance for select
  using (true);

create policy "Admins and muthawif can manage manasik attendance"
  on public.manasik_attendance for all
  using (public.is_admin() or public.current_user_role() in ('muthawif', 'guide'));

create trigger trg_manasik_attendance_updated_at
  before update on public.manasik_attendance
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Table: system_settings (Pengaturan Profil, Keuangan & Sistem)
-- ------------------------------------------------------------------------------
create table if not exists public.system_settings (
  id text primary key default 'default_settings',
  travel_name text not null default 'Al-Madinah Travel',
  company_legal_name text default 'PT Al-Madinah Wisata Syariah',
  ppiu_number text default 'Kemenag RI No. U.412 Tahun 2021',
  pihk_number text default 'Kemenag RI No. HK.108 Tahun 2023',
  accreditation text default 'Akreditasi A (Sangat Baik)',
  established_year text default '2016',
  support_phone text default '0812-9900-1122',
  support_email text default 'layanan@almedinahtravel.com',
  website_url text default 'https://almedinahtravel.com',
  head_office_address text default 'Jl. M.H. Thamrin No. 12, Menteng, Jakarta Pusat 10350',
  default_dp_amount numeric(15, 2) default 5000000.00,
  payment_due_days_before_departure integer default 30,
  enable_midtrans_gateway boolean default true,
  admin_fee_amount numeric(15, 2) default 0.00,
  wa_gateway_api_key text default '',
  wa_gateway_sender_number text default '',
  enable_wa_new_registration boolean default true,
  enable_wa_payment_reminder boolean default true,
  enable_wa_manasik_reminder boolean default true,
  enable_email_receipt boolean default true,
  session_timeout_minutes integer default 60,
  enforce_strong_password boolean default true,
  enable_audit_trail_logging boolean default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.system_settings enable row level security;

create policy "Users can view system settings"
  on public.system_settings for select
  using (true);

create policy "Admins can update system settings"
  on public.system_settings for all
  using (public.is_admin());

create trigger trg_system_settings_updated_at
  before update on public.system_settings
  for each row execute procedure public.handle_updated_at();

-- Seed initial default settings
insert into public.system_settings (id, travel_name, company_legal_name)
values ('default_settings', 'Al-Madinah Travel', 'PT Al-Madinah Wisata Syariah')
on conflict (id) do nothing;
