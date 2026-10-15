-- ==============================================================================
-- Migration: Add User Management and Activity Logs Audit Trail
-- Description: Adds branches, enhances profiles, creates activity_logs, and sets up RLS policies.
-- ==============================================================================

-- 1. Create branches table
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  code text unique not null,
  address text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for branches
alter table public.branches enable row level security;

-- Policies for branches
create policy "Anyone authenticated can view active branches"
  on public.branches
  for select
  to authenticated, anon
  using (is_active = true);

create policy "Admins can manage branches"
  on public.branches
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('super_admin')
    )
  );

create policy "Service role has full access to branches"
  on public.branches
  for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Insert default seed branches if not exists
insert into public.branches (name, code, address, is_active)
values
  ('Kantor Pusat Jakarta', 'JKT', 'Jl. TB Simatupang No. 18, Jakarta Selatan', true),
  ('Cabang Surabaya', 'SBY', 'Jl. Raya Darmo No. 45, Wonokromo, Surabaya', true),
  ('Cabang Bandung', 'BDG', 'Jl. Asia Afrika No. 102, Sumur Bandung, Bandung', true)
on conflict (code) do update set
  name = excluded.name,
  address = excluded.address;

-- 2. Enhance profiles table
alter table public.profiles
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists phone text;

-- Create index on branch_id and role
create index if not exists idx_profiles_branch_id on public.profiles(branch_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

-- Update RLS policies on profiles
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Super Admin & Admin Cabang can view all profiles" on public.profiles;
drop policy if exists "Super Admin can update all profiles" on public.profiles;
drop policy if exists "Admin Cabang can update branch jamaah profiles" on public.profiles;

-- Allow Super Admin and Admin Cabang to view all profiles, or users to view their own
create policy "Users can view own profile or admins can view all"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('super_admin', 'admin_cabang')
    )
  );

-- Super admin can update any profile
create policy "Super admin can update any profile"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'super_admin'
    )
  );

-- Admin cabang can update profiles in their branch (specifically jamaah)
create policy "Admin cabang can update branch profiles"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles admin_p
      where admin_p.id = auth.uid()
      and admin_p.role = 'admin_cabang'
      and (admin_p.branch_id = public.profiles.branch_id or admin_p.branch_id is null)
      and public.profiles.role in ('jamaah', 'jamaah_umroh', 'muthawif', 'mitra_agen')
    )
  );

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 3. Create activity_logs table
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  description text not null,
  ip_address text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for activity_logs
alter table public.activity_logs enable row level security;

-- Indexes for performance
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_action on public.activity_logs(action);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);

-- RLS policies for activity_logs
create policy "Admins can view all activity logs"
  on public.activity_logs
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('super_admin', 'admin_cabang')
    )
  );

create policy "Users can view their own activity logs"
  on public.activity_logs
  for select
  using (auth.uid() = user_id);

create policy "Service role has full access to activity logs"
  on public.activity_logs
  for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Authenticated users can insert activity logs"
  on public.activity_logs
  for insert
  with check (auth.uid() = user_id or auth.uid() is not null);

-- 4. Function helper to insert activity log securely
create or replace function public.log_system_activity(
  p_user_id uuid,
  p_action text,
  p_description text,
  p_ip_address text default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_log_id uuid;
begin
  insert into public.activity_logs (
    user_id,
    action,
    description,
    ip_address,
    metadata,
    created_at
  )
  values (
    p_user_id,
    p_action,
    p_description,
    p_ip_address,
    p_metadata,
    timezone('utc'::text, now())
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;
