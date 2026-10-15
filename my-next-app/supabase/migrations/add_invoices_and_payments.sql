-- ==============================================================================
-- Migration: Add Invoices and Payments Table for Midtrans Payment Gateway
-- ==============================================================================

-- 1. Create Enums if not exist
do $$ begin
  create type public.invoice_type as enum ('dp', 'cicilan', 'pelunasan');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_status as enum ('unpaid', 'partial', 'paid', 'expired', 'cancelled');
exception
  when duplicate_object then null;
end $$;

-- 2. Create Invoices Table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  booking_id uuid null,
  jamaah_id uuid null references public.profiles(id) on delete set null,
  type public.invoice_type not null default 'dp',
  amount numeric(15, 2) not null,
  paid_amount numeric(15, 2) not null default 0,
  status public.invoice_status not null default 'unpaid',
  due_date date not null,
  midtrans_order_id text null,
  midtrans_transaction_id text null,
  payment_method text null,
  payment_date timestamp with time zone null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 3. Create Payments Log Table (Detailed transaction audit history)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  order_id text not null,
  transaction_id text null,
  payment_type text not null,
  gross_amount numeric(15, 2) not null,
  transaction_status text not null,
  fraud_status text null,
  settlement_time timestamp with time zone null,
  raw_response jsonb null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 4. Indexes for high performance lookup
create index if not exists idx_invoices_invoice_number on public.invoices (invoice_number);
create index if not exists idx_invoices_midtrans_order_id on public.invoices (midtrans_order_id);
create index if not exists idx_invoices_status on public.invoices (status);
create index if not exists idx_invoices_jamaah_id on public.invoices (jamaah_id);
create index if not exists idx_payments_order_id on public.payments (order_id);
create index if not exists idx_payments_invoice_id on public.payments (invoice_id);

-- 5. Enable Row Level Security (RLS)
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

-- 6. RLS Policies
create policy "Jamaah can view own invoices"
  on public.invoices
  for select
  using (
    auth.uid() = jamaah_id or
    auth.jwt() ->> 'role' in ('admin', 'service_role') or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'admin_cabang', 'super_admin')
    )
  );

create policy "Admins and service role have full invoices access"
  on public.invoices
  for all
  using (
    auth.jwt() ->> 'role' = 'service_role' or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'admin_cabang', 'super_admin')
    )
  );

create policy "Admins and service role have full payments access"
  on public.payments
  for all
  using (
    auth.jwt() ->> 'role' = 'service_role' or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'admin_cabang', 'super_admin')
    )
  );

-- 7. Trigger auto-update updated_at on invoices
create or replace function public.update_invoices_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_invoices_updated_at on public.invoices;
create trigger trigger_invoices_updated_at
  before update on public.invoices
  for each row
  execute procedure public.update_invoices_updated_at();

-- 8. Seed Initial Data matching Screenshot 2
insert into public.invoices (invoice_number, type, amount, paid_amount, status, due_date)
values
  ('INV-DP-REG-286259', 'dp', 5000000, 0, 'unpaid', '2026-10-09'),
  ('INV-DP-REG-241954', 'dp', 5000000, 0, 'unpaid', '2026-10-09'),
  ('INV-PELUNASAN-202611-002', 'cicilan', 19500000, 19500000, 'paid', '2026-10-25'),
  ('INV-DP-202611-002', 'dp', 10000000, 0, 'unpaid', '2026-10-10')
on conflict (invoice_number) do nothing;
