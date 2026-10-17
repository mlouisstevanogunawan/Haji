-- ==============================================================================
-- 20261017_harden_rls_anon_access.sql  (OPSIONAL, sangat disarankan)
-- ==============================================================================
-- Hasil pengecekan langsung ke project ini (2026-10-17):
--   - anon key BISA membaca data pribadi jamaah   -> profiles 20 baris,
--     invoices 19, documents 25, bookings 15.
--   - anon key BISA menulis: percobaan INSERT ke announcements mengembalikan 201
--     dan PATCH no-op ke documents mengembalikan 200.
-- Artinya RLS pada tabel-tabel itu sedang tidak efektif. anon key ikut ter-bundle
-- ke JavaScript browser (NEXT_PUBLIC_*), jadi siapa pun yang membuka situsnya
-- bisa mengambil dan mengubah data jamaah.
--
-- Kode aplikasi sudah dipindah supaya aman terhadap RLS ketat:
--   - seluruh tulis form lewat /api/db (service_role, bypass RLS),
--   - seluruh baca tabel berisi data pribadi lewat /api/db juga,
--   - tabel katalog (packages, hotels, flights, branches, bank_accounts, agents,
--     guides, announcements, manasik, system_settings, equipment) tetap boleh
--     dibaca anon lewat policy "_read" di migration 20261017_sync_crud_schema_and_rls.
-- Jadi menjalankan file ini tidak membuat fitur apa pun hilang — hanya menutup
-- pintu belakang.
--
-- Jalankan setelah migration 20261017_sync_crud_schema_and_rls.sql.
-- Idempoten: aman dijalankan berulang kali.

-- ------------------------------------------------------------------------------
-- 1. Pastikan helper peran ada (didefinisikan ulang bila sudah ada)
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    auth.jwt() ->> 'role' in ('service_role'),
    false
  ) or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in (
        'admin', 'super_admin', 'superadmin', 'admin_cabang',
        'admin_operasional', 'staff_dokumen'
      )
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. Aktifkan RLS + policy rapi untuk tabel yang berisi data pribadi
-- ------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','bookings','documents','invoices','payments','commissions',
    'activity_logs','equipment_assignments','manasik_attendance'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    -- service_role (dipakai /api/db dan webhook Midtrans) boleh segalanya.
    execute format('drop policy if exists "%s_service_role_full" on public.%I', t, t);
    execute format(
      'create policy "%s_service_role_full" on public.%I for all to service_role '
      || 'using (true) with check (true)', t, t
    );

    -- Admin sejati (kalau nanti sudah pakai Supabase Auth) boleh segalanya.
    execute format('drop policy if exists "%s_admin_full" on public.%I', t, t);
    execute format(
      'create policy "%s_admin_full" on public.%I for all to authenticated '
      || 'using (public.is_admin()) with check (public.is_admin())', t, t
    );
  end loop;
end $$;

-- Jamaah masih boleh melihat tagihan, dokumen, dan perlengkapannya sendiri.
do $$
begin
  drop policy if exists "jamaah read own invoices" on public.invoices;
  create policy "jamaah read own invoices"
    on public.invoices for select to authenticated
    using (jamaah_id = auth.uid());

  drop policy if exists "jamaah read own documents" on public.documents;
  create policy "jamaah read own documents"
    on public.documents for select to authenticated
    using (pilgrim_id = auth.uid());

  drop policy if exists "jamaah read own bookings" on public.bookings;
  create policy "jamaah read own bookings"
    on public.bookings for select to authenticated
    using (pilgrim_id = auth.uid());

  drop policy if exists "jamaah read own equipment" on public.equipment_assignments;
  create policy "jamaah read own equipment"
    on public.equipment_assignments for select to authenticated
    using (pilgrim_id = auth.uid());

  drop policy if exists "user read own profile" on public.profiles;
  create policy "user read own profile"
    on public.profiles for select to authenticated
    using (id = auth.uid());
end $$;

-- ------------------------------------------------------------------------------
-- 3. Verifikasi: tabel mana yang sudah aktif RLS-nya
-- ------------------------------------------------------------------------------
-- select c.relname, c.relrowsecurity
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relname in ('profiles','bookings','documents','invoices','payments',
--                     'commissions','activity_logs','equipment_assignments',
--                     'manasik_attendance','packages','hotels','branches')
-- order by c.relname;
