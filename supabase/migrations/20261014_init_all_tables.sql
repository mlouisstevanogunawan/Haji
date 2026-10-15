-- ==============================================================================
-- Migration: Init all application tables (derived 100% from my-next-app codebase)
-- Date: 2026-10-14
-- Sources: src/types/supabase.types.ts, src/services/*, src/features/*, src/app/api/*
-- Idempotent: safe to re-run.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. ENUM TYPES (supabase.types.ts:581-590)
-- ------------------------------------------------------------------------------
do $$ begin
  create type public.package_type as enum ('umroh','haji');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('pending','confirmed','cancelled','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum ('unpaid','partial','paid','expired','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_type as enum ('dp','cicilan','pelunasan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.commission_status as enum ('pending','paid','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_type as enum ('passport','visa','vaccine_certificate','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.announcement_audience as enum ('all','jamaah','agents','guides');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.equipment_condition as enum ('good','damaged','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.hotel_city as enum ('makkah','madinah');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS + updated_at trigger
-- ------------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) in ('super_admin','admin_cabang'),
    false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- ------------------------------------------------------------------------------
-- 2. ALTER EXISTING TABLES (profiles, branches) — columns referenced in code
-- ------------------------------------------------------------------------------
-- raw_user_meta_data is selected directly from profiles (manasikService.ts:113,
-- studentService.ts:21-36, jamaahService.ts:35-45); avatar_text (database.ts:24,
-- UsersTable.tsx:249)
alter table public.profiles
  add column if not exists raw_user_meta_data jsonb,
  add column if not exists avatar_text text;

-- is_headquarter (branchService.ts:11,22; cabang/page.tsx:154)
alter table public.branches
  add column if not exists is_headquarter boolean not null default false;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_branches on public.branches;
create trigger set_updated_at_branches before update on public.branches
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. PARENT (standalone) TABLES
-- ------------------------------------------------------------------------------

-- packages (supabase.types.ts:450; packageService.ts, dashboardService.ts:10)
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.package_type not null default 'umroh',
  price numeric not null,
  duration_days integer not null,
  quota integer not null default 0,
  facilities text[],
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_packages_type on public.packages(type);
create index if not exists idx_packages_is_active on public.packages(is_active);

-- hotels (supabase.types.ts:345; hotelService.ts)
create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city public.hotel_city not null,
  address text,
  rating numeric,
  price_per_night numeric,
  photo_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_hotels_city on public.hotels(city);

-- flights (supabase.types.ts:271; flightService.ts)
create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  airline_code text not null,
  airline_name text not null,
  route text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- equipment (supabase.types.ts:241; equipmentService.ts)
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  quantity integer not null default 0,
  condition public.equipment_condition not null default 'good',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- guides (supabase.types.ts:298; guideService.ts) FK -> profiles
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  phone text,
  experience_years integer not null default 0,
  language_skills text[],
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_guides_user_id on public.guides(user_id);

-- agents (supabase.types.ts:15; agentService.ts) FK -> profiles
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  phone text,
  commission_rate numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_agents_user_id on public.agents(user_id);

-- announcements (supabase.types.ts:59; announcementService.ts)
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  target_audience public.announcement_audience not null default 'all',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_announcements_published on public.announcements(is_published, published_at desc);

-- system_settings (systemSettingsService.ts:103-132; single row id='default_settings')
create table if not exists public.system_settings (
  id text primary key default 'default_settings',
  travel_name text not null default 'Al-Madinah Travel',
  company_legal_name text,
  ppiu_number text,
  pihk_number text,
  accreditation text,
  established_year text,
  support_phone text,
  support_email text,
  website_url text,
  head_office_address text,
  default_dp_amount numeric not null default 5000000,
  payment_due_days_before_departure integer not null default 30,
  enable_midtrans_gateway boolean not null default true,
  admin_fee_amount numeric not null default 0,
  wa_gateway_api_key text,
  wa_gateway_sender_number text,
  enable_wa_new_registration boolean not null default true,
  enable_wa_payment_reminder boolean not null default true,
  enable_wa_manasik_reminder boolean not null default true,
  enable_email_receipt boolean not null default true,
  session_timeout_minutes integer not null default 60,
  enforce_strong_password boolean not null default true,
  enable_audit_trail_logging boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- bank_accounts (bankAccountService.ts:3-13)
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  branch_name text,
  account_number text not null unique,
  account_holder text not null,
  office_branch text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- manasik_sessions (manasikService.ts:3-16) FK -> packages, profiles
create table if not exists public.manasik_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  package_id uuid references public.packages(id) on delete set null,
  session_date date not null,
  session_time time,
  location text not null default '',
  muthawif_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_manasik_sessions_session_date on public.manasik_sessions(session_date);
create index if not exists idx_manasik_sessions_package_id on public.manasik_sessions(package_id);

-- ------------------------------------------------------------------------------
-- 4. CHILD TABLES (depend on tables above)
-- ------------------------------------------------------------------------------

-- bookings (supabase.types.ts:92; bookingService.ts) FK -> packages, profiles
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid not null references public.profiles(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete restrict,
  booking_date date not null default current_date,
  departure_date date,
  return_date date,
  status public.booking_status not null default 'pending',
  total_price numeric not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_bookings_pilgrim_id on public.bookings(pilgrim_id);
create index if not exists idx_bookings_package_id on public.bookings(package_id);
create index if not exists idx_bookings_status on public.bookings(status);

-- documents (supabase.types.ts:194; documentService.ts) FK -> profiles
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.document_type not null,
  document_number text,
  issue_date date,
  expiry_date date,
  file_url text,
  status public.document_status not null default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_documents_pilgrim_id on public.documents(pilgrim_id);
create index if not exists idx_documents_status on public.documents(status);

-- invoices (supabase.types.ts:381; invoiceService.ts, midtrans route) FK -> bookings, profiles
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  booking_id uuid references public.bookings(id) on delete set null,
  jamaah_id uuid references public.profiles(id) on delete set null,
  type public.invoice_type not null default 'dp',
  amount numeric not null,
  paid_amount numeric not null default 0,
  status public.invoice_status not null default 'unpaid',
  due_date date not null,
  payment_date date,
  payment_method text,
  midtrans_order_id text,
  midtrans_transaction_id text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_invoices_booking_id on public.invoices(booking_id);
create index if not exists idx_invoices_jamaah_id on public.invoices(jamaah_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_midtrans_order_id on public.invoices(midtrans_order_id);

-- payments (supabase.types.ts:492; midtrans notification insert, no updated_at in schema) FK -> invoices
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete set null,
  order_id text not null unique,
  transaction_id text,
  transaction_status text not null,
  payment_type text not null,
  gross_amount numeric not null,
  fraud_status text,
  settlement_time timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);

-- commissions (supabase.types.ts:146; commissionService.ts) FK -> agents, bookings
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric not null,
  status public.commission_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_commissions_agent_id on public.commissions(agent_id);
create index if not exists idx_commissions_booking_id on public.commissions(booking_id);
create index if not exists idx_commissions_status on public.commissions(status);

-- manasik_attendance (manasikService.ts:18-28) FK -> manasik_sessions, profiles
-- status uses CHECK not enum: values are Indonesian literals from code, keeping text is the safe pick
create table if not exists public.manasik_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.manasik_sessions(id) on delete cascade,
  pilgrim_id uuid references public.profiles(id) on delete set null,
  pilgrim_name text not null,
  nik text,
  status text not null default 'Hadir' check (status in ('Hadir','Izin','Sakit','Alpa')),
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists idx_manasik_attendance_session_id on public.manasik_attendance(session_id);
create index if not exists idx_manasik_attendance_pilgrim_id on public.manasik_attendance(pilgrim_id);

-- ------------------------------------------------------------------------------
-- 5. updated_at TRIGGERS
-- ------------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['packages','hotels','flights','equipment','guides','agents',
    'announcements','system_settings','bank_accounts','manasik_sessions','bookings',
    'documents','invoices','commissions','manasik_attendance']
  loop
    execute format('drop trigger if exists set_updated_at_%I on public.%I', t, t);
    execute format('create trigger set_updated_at_%I before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- App reads/writes mostly via anon key with a logged-in user (lib/supabase/client.ts),
-- so authenticated users get full CRUD on operational tables, matching the existing
-- migration's admin-role conventions. profiles/branches/activity_logs policies from
-- earlier migrations are preserved; service_role always bypasses via admin clients.
-- ------------------------------------------------------------------------------
alter table public.packages enable row level security;
alter table public.hotels enable row level security;
alter table public.flights enable row level security;
alter table public.equipment enable row level security;
alter table public.guides enable row level security;
alter table public.agents enable row level security;
alter table public.announcements enable row level security;
alter table public.system_settings enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.manasik_sessions enable row level security;
alter table public.bookings enable row level security;
alter table public.documents enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.commissions enable row level security;
alter table public.manasik_attendance enable row level security;
alter table public.activity_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['packages','hotels','flights','equipment','guides','agents',
    'announcements','system_settings','bank_accounts','manasik_sessions','bookings',
    'documents','invoices','payments','commissions','manasik_attendance']
  loop
    execute format('drop policy if exists "authenticated_full_access_%s" on public.%I', t, t);
    execute format('create policy "authenticated_full_access_%s" on public.%s for all to authenticated using (true) with check (true)', t, t);
    execute format('drop policy if exists "service_role_full_access_%s" on public.%I', t, t);
    execute format('create policy "service_role_full_access_%s" on public.%s for all to service_role using (true) with check (true)', t, t);
  end loop;
end $$;

-- activity_logs: admins + service_role insert/see all; users see own (extended from prior migration)
drop policy if exists "service_role_full_access_activity_logs" on public.activity_logs;
create policy "service_role_full_access_activity_logs" on public.activity_logs
  for all to service_role using (true) with check (true);

-- system_settings readable by anon (public travel info used on public pages)
drop policy if exists "public_read_system_settings" on public.system_settings;
create policy "public_read_system_settings" on public.system_settings
  for select to anon using (true);
