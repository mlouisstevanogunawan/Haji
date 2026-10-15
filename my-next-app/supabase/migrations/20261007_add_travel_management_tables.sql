-- ==============================================================================
-- Migration: Add Travel Management Tables
-- 1. packages
-- 2. hotels
-- 3. flights
-- 4. bookings
-- 5. documents
-- 6. equipment
-- 7. agents
-- 8. guides
-- 9. announcements
-- 10. commissions
-- With RLS Policies, Foreign Keys, Triggers, and Indexes
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper Functions for Roles & RLS
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
begin
  return coalesce(
    auth.jwt() ->> 'role' = 'service_role' or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin', 'admin_cabang', 'superadmin', 'admin_operasional')
    ),
    false
  );
end;
$$ language plpgsql security definer;

create or replace function public.current_user_role()
returns text as $$
begin
  return (
    select role from public.profiles where id = auth.uid() limit 1
  );
end;
$$ language plpgsql security definer;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Create Enums
-- ------------------------------------------------------------------------------
do $$ begin
  create type public.package_type as enum ('umroh', 'haji');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.hotel_city as enum ('makkah', 'madinah');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.document_type as enum ('passport', 'visa', 'vaccine_certificate', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.document_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.equipment_condition as enum ('good', 'damaged', 'lost');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.announcement_audience as enum ('all', 'jamaah', 'agents', 'guides');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.commission_status as enum ('pending', 'paid', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------------------------
-- 3. Create Tables
-- ------------------------------------------------------------------------------

-- Table 1: packages
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.package_type not null default 'umroh',
  price numeric(15, 2) not null,
  duration_days integer not null check (duration_days > 0),
  quota integer not null default 0 check (quota >= 0),
  facilities text[] default '{}',
  description text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 2: hotels
create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city public.hotel_city not null,
  rating integer check (rating between 1 and 5),
  price_per_night numeric(15, 2),
  address text,
  photo_url text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 3: flights
create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  airline_name text not null,
  airline_code text not null unique,
  route text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 4: bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid not null references public.profiles(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete restrict,
  booking_date date not null default current_date,
  departure_date date,
  return_date date,
  status public.booking_status not null default 'pending',
  total_price numeric(15, 2) not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 5: documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.document_type not null,
  document_number text,
  issue_date date,
  expiry_date date,
  file_url text,
  status public.document_status not null default 'pending',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 6: equipment
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  quantity integer not null default 0 check (quantity >= 0),
  condition public.equipment_condition not null default 'good',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 7: agents
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text,
  email text,
  commission_rate numeric(5, 4) not null default 0.1000,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 8: guides
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text,
  email text,
  experience_years integer not null default 0,
  language_skills text[] default '{}',
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 9: announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  target_audience public.announcement_audience not null default 'all',
  is_published boolean not null default false,
  published_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table 10: commissions
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(15, 2) not null,
  status public.commission_status not null default 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Optional: Link invoices.booking_id constraint if not present
do $$ begin
  alter table public.invoices 
    add constraint fk_invoices_booking foreign key (booking_id) references public.bookings(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------------------------
-- 4. Triggers for updated_at
-- ------------------------------------------------------------------------------
drop trigger if exists trg_packages_updated_at on public.packages;
create trigger trg_packages_updated_at before update on public.packages for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_hotels_updated_at on public.hotels;
create trigger trg_hotels_updated_at before update on public.hotels for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_flights_updated_at on public.flights;
create trigger trg_flights_updated_at before update on public.flights for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at before update on public.bookings for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at before update on public.documents for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_equipment_updated_at on public.equipment;
create trigger trg_equipment_updated_at before update on public.equipment for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_agents_updated_at on public.agents;
create trigger trg_agents_updated_at before update on public.agents for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_guides_updated_at on public.guides;
create trigger trg_guides_updated_at before update on public.guides for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at before update on public.announcements for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_commissions_updated_at on public.commissions;
create trigger trg_commissions_updated_at before update on public.commissions for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Indexes for Performance
-- ------------------------------------------------------------------------------
create index if not exists idx_packages_type on public.packages (type);
create index if not exists idx_packages_is_active on public.packages (is_active);

create index if not exists idx_hotels_city on public.hotels (city);
create index if not exists idx_hotels_rating on public.hotels (rating);

create index if not exists idx_flights_airline_code on public.flights (airline_code);

create index if not exists idx_bookings_pilgrim_id on public.bookings (pilgrim_id);
create index if not exists idx_bookings_package_id on public.bookings (package_id);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_departure_date on public.bookings (departure_date);

create index if not exists idx_documents_pilgrim_id on public.documents (pilgrim_id);
create index if not exists idx_documents_type on public.documents (document_type);
create index if not exists idx_documents_status on public.documents (status);

create index if not exists idx_equipment_category on public.equipment (category);
create index if not exists idx_equipment_condition on public.equipment (condition);

create index if not exists idx_agents_user_id on public.agents (user_id);
create index if not exists idx_agents_is_active on public.agents (is_active);

create index if not exists idx_guides_user_id on public.guides (user_id);
create index if not exists idx_guides_is_active on public.guides (is_active);

create index if not exists idx_announcements_published on public.announcements (is_published);
create index if not exists idx_announcements_audience on public.announcements (target_audience);

create index if not exists idx_commissions_agent_id on public.commissions (agent_id);
create index if not exists idx_commissions_booking_id on public.commissions (booking_id);
create index if not exists idx_commissions_status on public.commissions (status);

-- ------------------------------------------------------------------------------
-- 6. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
alter table public.packages enable row level security;
alter table public.hotels enable row level security;
alter table public.flights enable row level security;
alter table public.bookings enable row level security;
alter table public.documents enable row level security;
alter table public.equipment enable row level security;
alter table public.agents enable row level security;
alter table public.guides enable row level security;
alter table public.announcements enable row level security;
alter table public.commissions enable row level security;

-- ------------------------------------------------------------------------------
-- 7. RLS Policies
-- ------------------------------------------------------------------------------

-- --- PACKAGES ---
-- Public / all users can view active packages; Admins can view all
create policy "Anyone can view active packages"
  on public.packages for select
  using (is_active = true or public.is_admin());

create policy "Admins can manage packages"
  on public.packages for all
  using (public.is_admin());

-- --- HOTELS ---
-- Everyone can view hotels; Admins can manage
create policy "Anyone can view hotels"
  on public.hotels for select
  using (true);

create policy "Admins can manage hotels"
  on public.hotels for all
  using (public.is_admin());

-- --- FLIGHTS ---
-- Everyone can view flights; Admins can manage
create policy "Anyone can view flights"
  on public.flights for select
  using (true);

create policy "Admins can manage flights"
  on public.flights for all
  using (public.is_admin());

-- --- BOOKINGS ---
-- Pilgrims can view their own bookings; Guides can view bookings; Admins have full access
create policy "Users can view relevant bookings"
  on public.bookings for select
  using (
    public.is_admin() or
    pilgrim_id = auth.uid() or
    public.current_user_role() in ('muthawif', 'guide') or
    exists (
      select 1 from public.agents a
      join public.commissions c on c.agent_id = a.id
      where c.booking_id = bookings.id and (a.user_id = auth.uid() or a.email = auth.jwt()->>'email')
    )
  );

create policy "Pilgrims and admins can insert bookings"
  on public.bookings for insert
  with check (
    public.is_admin() or
    pilgrim_id = auth.uid()
  );

create policy "Pilgrims and admins can update bookings"
  on public.bookings for update
  using (
    public.is_admin() or
    (pilgrim_id = auth.uid() and status = 'pending')
  );

create policy "Admins can delete bookings"
  on public.bookings for delete
  using (public.is_admin());

-- --- DOCUMENTS ---
-- Pilgrims view own documents; Staff and admins view all
create policy "Pilgrims view own documents or staff view all"
  on public.documents for select
  using (
    public.is_admin() or
    pilgrim_id = auth.uid() or
    public.current_user_role() in ('staff_dokumen', 'admin_operasional')
  );

create policy "Pilgrims can upload own documents"
  on public.documents for insert
  with check (
    public.is_admin() or
    pilgrim_id = auth.uid()
  );

create policy "Pilgrims and admins can update documents"
  on public.documents for update
  using (
    public.is_admin() or
    pilgrim_id = auth.uid()
  );

create policy "Pilgrims and admins can delete documents"
  on public.documents for delete
  using (
    public.is_admin() or
    pilgrim_id = auth.uid()
  );

-- --- EQUIPMENT ---
-- Authenticated users (staff/guides/admin) can view equipment; Admins manage
create policy "Authenticated users can view equipment"
  on public.equipment for select
  using (auth.uid() is not null);

create policy "Admins can manage equipment"
  on public.equipment for all
  using (public.is_admin());

-- --- AGENTS ---
-- Active agents viewable by all; Agent user can view/update own profile; Admins manage all
create policy "View active agents or own agent record"
  on public.agents for select
  using (
    is_active = true or
    user_id = auth.uid() or
    public.is_admin()
  );

create policy "Agents can update own profile"
  on public.agents for update
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins can manage agents"
  on public.agents for all
  using (public.is_admin());

-- --- GUIDES ---
-- Active guides viewable by all; Guide user can view/update own profile; Admins manage all
create policy "View active guides or own guide record"
  on public.guides for select
  using (
    is_active = true or
    user_id = auth.uid() or
    public.is_admin()
  );

create policy "Guides can update own profile"
  on public.guides for update
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins can manage guides"
  on public.guides for all
  using (public.is_admin());

-- --- ANNOUNCEMENTS ---
-- Users can view published announcements targeted at them; Admins view/manage all
create policy "Users can view published announcements"
  on public.announcements for select
  using (
    public.is_admin() or
    (
      is_published = true and (
        target_audience = 'all' or
        (target_audience = 'jamaah' and public.current_user_role() in ('jamaah', 'jamaah_umroh')) or
        (target_audience = 'agents' and public.current_user_role() in ('mitra_agen', 'agent')) or
        (target_audience = 'guides' and public.current_user_role() in ('muthawif', 'guide'))
      )
    )
  );

create policy "Admins can manage announcements"
  on public.announcements for all
  using (public.is_admin());

-- --- COMMISSIONS ---
-- Agents can view their own commissions; Admins manage all
create policy "Agents can view own commissions"
  on public.commissions for select
  using (
    public.is_admin() or
    exists (
      select 1 from public.agents a
      where a.id = commissions.agent_id and (a.user_id = auth.uid() or a.email = auth.jwt()->>'email')
    )
  );

create policy "Admins can manage commissions"
  on public.commissions for all
  using (public.is_admin());
