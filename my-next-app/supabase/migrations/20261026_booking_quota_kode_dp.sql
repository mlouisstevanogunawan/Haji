-- Pendaftaran: kuota terisi, kode booking unik, tagihan DP otomatis.
--
-- Semua aturan ini dibuat di database, bukan di salah satu halaman, karena
-- booking dibuat dari tiga tempat: /pendaftaran/daftar, /agen/pendaftaran/daftar,
-- dan form cepat di /pendaftaran. Aturan di halaman hanya melindungi satu jalur.

-- ---------------------------------------------------------------------------
-- 1. Kolom baru
-- ---------------------------------------------------------------------------

alter table public.packages
  add column if not exists booked_count integer not null default 0;

comment on column public.packages.booked_count is
  'Jumlah booking aktif (status bukan cancelled). Dijaga oleh trigger, jangan ditulis manual.';

alter table public.bookings
  add column if not exists kode_booking text;

alter table public.bookings
  add column if not exists room_type text
    constraint bookings_room_type_check
    check (room_type is null or room_type in ('single', 'double', 'triple', 'quad'));

-- ---------------------------------------------------------------------------
-- 2. Backfill kode_booking untuk baris lama (REG-YYYYMM-XXXX, urut tanggal)
--    Dijalankan sebelum unique index agar tidak menabrak duplikat.
-- ---------------------------------------------------------------------------

with ranked as (
  select
    id,
    to_char(coalesce(booking_date, created_at::date), 'YYYYMM') as ym,
    row_number() over (
      partition by to_char(coalesce(booking_date, created_at::date), 'YYYYMM')
      order by booking_date, created_at, id
    ) as seq
  from public.bookings
  where kode_booking is null or btrim(kode_booking) = ''
)
update public.bookings b
set kode_booking = 'REG-' || ranked.ym || '-' || lpad(ranked.seq::text, 4, '0')
from ranked
where b.id = ranked.id;

-- Setelah baris lama terisi, kolom ini tidak boleh kosong lagi: trigger di
-- bawah menjamin setiap insert baru mendapat kode, jadi NOT NULL bisa dipasang.
alter table public.bookings
  alter column kode_booking set not null;

-- ---------------------------------------------------------------------------
-- 3. Index
-- ---------------------------------------------------------------------------

create unique index if not exists bookings_kode_booking_key
  on public.bookings (kode_booking);

-- Satu jamaah hanya boleh punya satu pendaftaran aktif per paket.
create unique index if not exists bookings_one_active_per_pilgrim_package
  on public.bookings (pilgrim_id, package_id)
  where status <> 'cancelled';

create index if not exists idx_bookings_pilgrim_id on public.bookings (pilgrim_id);
create index if not exists idx_bookings_package_id on public.bookings (package_id);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_booking_date on public.bookings (booking_date);
create index if not exists idx_invoices_booking_id on public.invoices (booking_id);
create index if not exists idx_invoices_status on public.invoices (status);

-- ---------------------------------------------------------------------------
-- 4. Trigger: kode_booking otomatis bila pengirim tidak mengisi
-- ---------------------------------------------------------------------------
-- Logika sengaja ditulis inline (tidak memanggil helper) supaya fungsi ini
-- boleh di-revoke dari anon/authenticated: trigger dipanggil executor, tetapi
-- panggilan antar-fungsi di dalam body security invoker tetap dicek hak
-- EXECUTE-nya oleh Postgres.

create or replace function public.trg_bookings_set_kode()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_month text := to_char(coalesce(new.booking_date, current_date), 'YYYYMM');
  v_next integer;
  v_code text;
begin
  if new.kode_booking is not null and btrim(new.kode_booking) <> '' then
    return new;
  end if;

  -- Mengunci per bulan agar dua booking serentak tidak membaca max() yang sama.
  perform pg_advisory_xact_lock(hashtext('booking_code_' || v_month));

  loop
    select coalesce(max((split_part(kode_booking, '-', 3))::integer), 0) + 1
      into v_next
      from public.bookings
      where kode_booking ~ ('^REG-' || v_month || '-[0-9]{4}$');

    v_code := 'REG-' || v_month || '-' || lpad(v_next::text, 4, '0');

    if not exists (select 1 from public.bookings where kode_booking = v_code) then
      new.kode_booking := v_code;
      return new;
    end if;

    if v_next > 9999 then
      raise exception 'Nomor kode booking untuk bulan % sudah habis (maksimum 9999).', v_month;
    end if;
  end loop;
end;
$$;

drop trigger if exists trg_bookings_set_kode on public.bookings;
create trigger trg_bookings_set_kode
  before insert on public.bookings
  for each row execute function public.trg_bookings_set_kode();

-- ---------------------------------------------------------------------------
-- 5. Trigger: tolak booking yang melebihi kuota paket
-- ---------------------------------------------------------------------------

create or replace function public.trg_bookings_check_quota()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_quota integer;
  v_filled integer;
begin
  -- Pembatalan tidak menambah kursi, dan pindah paket dari paket lama aman.
  if new.status = 'cancelled' then
    return new;
  end if;

  -- Update dalam paket yang sama: booked_count sudah menghitung baris ini,
  -- jadi memeriksa ulang akan menolak pendaftaran yang sudah sah.
  if tg_op = 'UPDATE' and new.package_id is not distinct from old.package_id then
    return new;
  end if;

  if new.package_id is null then
    return new;
  end if;

  -- Mengunci baris paket: booking serentak pada paket yang sama antre di sini,
  -- sehingga booked_count yang dibaca sudah final saat insert selesai.
  select quota, booked_count
    into v_quota, v_filled
    from public.packages
    where id = new.package_id
    for update;

  if not found then
    raise exception 'Paket yang dipilih tidak ditemukan.';
  end if;

  if v_quota is not null and v_quota > 0 and v_filled >= v_quota then
    raise exception 'Kuota paket sudah penuh (terisi % dari % kursi).', v_filled, v_quota
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bookings_check_quota on public.bookings;
create trigger trg_bookings_check_quota
  before insert or update on public.bookings
  for each row execute function public.trg_bookings_check_quota();

-- ---------------------------------------------------------------------------
-- 6. Trigger: jaga packages.booked_count tetap sama dengan jumlah booking
-- ---------------------------------------------------------------------------
-- Dihitung ulang (bukan +1/-1) supaya tidak pernah melenceng walau data
-- diubah lewat jalur lain, termasuk penghapusan dari daftar pendaftaran.

create or replace function public.trg_bookings_sync_count()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_target uuid;
  v_count integer;
begin
  if tg_op = 'DELETE' then
    v_target := old.package_id;
  else
    v_target := new.package_id;
  end if;

  if v_target is not null then
    select count(*) into v_count
      from public.bookings
      where package_id = v_target
        and status <> 'cancelled';
    update public.packages set booked_count = v_count where id = v_target;
  end if;

  -- Pindah paket: paket asal juga harus dihitung ulang.
  if tg_op = 'UPDATE' and old.package_id is distinct from new.package_id then
    select count(*) into v_count
      from public.bookings
      where package_id = old.package_id
        and status <> 'cancelled';
    update public.packages set booked_count = v_count where id = old.package_id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_bookings_sync_count on public.bookings;
create trigger trg_bookings_sync_count
  after insert or update or delete on public.bookings
  for each row execute function public.trg_bookings_sync_count();

-- ---------------------------------------------------------------------------
-- 7. Trigger: tagihan DP otomatis saat pendaftaran dibuat
-- ---------------------------------------------------------------------------
-- DP memakai packages.down_payment bila terisi, selain itu 50% dari harga.
-- Jatuh tempo 7 hari setelah tanggal booking.

create or replace function public.trg_bookings_make_dp()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pkg_down numeric;
  v_dp numeric;
  v_year text := to_char(coalesce(new.booking_date, current_date), 'YYYY');
  v_next integer;
  v_number text;
begin
  if new.total_price is null or new.total_price <= 0 then
    return null;
  end if;

  -- Jangan menimpa skema tagihan yang sudah ada pada booking ini.
  if exists (select 1 from public.invoices where booking_id = new.id) then
    return null;
  end if;

  select down_payment into v_pkg_down
    from public.packages
    where id = new.package_id;

  if coalesce(v_pkg_down, 0) > 0 then
    v_dp := least(v_pkg_down, new.total_price);
  else
    v_dp := round(new.total_price * 0.5);
  end if;

  perform pg_advisory_xact_lock(hashtext('invoice_number_' || v_year));

  select coalesce(max((split_part(invoice_number, '-', 3))::integer), 0) + 1
    into v_next
    from public.invoices
    where invoice_number ~ ('^INV-' || v_year || '-[0-9]{4}$');

  v_number := 'INV-' || v_year || '-' || lpad(v_next::text, 4, '0');
  if exists (select 1 from public.invoices where invoice_number = v_number) then
    v_number := v_number || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 4));
  end if;

  insert into public.invoices (
    invoice_number, booking_id, jamaah_id, type, amount, paid_amount, status, due_date
  ) values (
    v_number,
    new.id,
    new.pilgrim_id,
    'dp',
    v_dp,
    0,
    'unpaid',
    coalesce(new.booking_date, current_date) + 7
  );

  return null;
end;
$$;

drop trigger if exists trg_bookings_make_dp on public.bookings;
create trigger trg_bookings_make_dp
  after insert on public.bookings
  for each row execute function public.trg_bookings_make_dp();

-- ---------------------------------------------------------------------------
-- 8. Backfill booked_count
-- ---------------------------------------------------------------------------

update public.packages p
set booked_count = coalesce((
  select count(*)
  from public.bookings b
  where b.package_id = p.id
    and b.status <> 'cancelled'
), 0);

-- ---------------------------------------------------------------------------
-- 9. Backfill tagihan DP untuk booking lama yang belum punya tagihan apa pun
-- ---------------------------------------------------------------------------

with need as (
  select b.id, b.pilgrim_id, b.package_id, b.total_price, b.booking_date
  from public.bookings b
  where b.total_price is not null and b.total_price > 0
    and not exists (select 1 from public.invoices i where i.booking_id = b.id)
),
numbered as (
  select
    need.*,
    coalesce(p.down_payment, 0) as pkg_down,
    to_char(coalesce(need.booking_date, current_date), 'YYYY') as ym,
    row_number() over (
      partition by to_char(coalesce(need.booking_date, current_date), 'YYYY')
      order by need.booking_date, need.id
    ) as seq,
    coalesce((
      select max((split_part(i.invoice_number, '-', 3))::integer)
      from public.invoices i
      where i.invoice_number ~ ('^INV-' || to_char(coalesce(need.booking_date, current_date), 'YYYY') || '-[0-9]{4}$')
    ), 0) as existing_max
  from need
  left join public.packages p on p.id = need.package_id
)
insert into public.invoices (
  invoice_number, booking_id, jamaah_id, type, amount, paid_amount, status, due_date
)
select
  'INV-' || numbered.ym || '-' ||
    lpad((numbered.existing_max + numbered.seq)::text, 4, '0'),
  numbered.id,
  numbered.pilgrim_id,
  'dp',
  case
    when numbered.pkg_down > 0 then least(numbered.pkg_down, numbered.total_price)
    else round(numbered.total_price * 0.5)
  end,
  0,
  'unpaid',
  coalesce(numbered.booking_date, current_date) + 7
from numbered;

-- ---------------------------------------------------------------------------
-- 10. Hak akses fungsi
-- ---------------------------------------------------------------------------
-- Fungsi trigger dijalankan executor, bukan dipanggil lewat /rpc, jadi EXECUTE
-- dicabut dari peran publik agar tidak menjadi endpoint baru.

revoke all on function public.trg_bookings_set_kode() from public, anon, authenticated;
revoke all on function public.trg_bookings_check_quota() from public, anon, authenticated;
revoke all on function public.trg_bookings_sync_count() from public, anon, authenticated;
revoke all on function public.trg_bookings_make_dp() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11. Realtime untuk packages agar sisa kuota ikut berubah tanpa refresh
-- ---------------------------------------------------------------------------

do $$
begin
  -- Publikasi ini dibuat Supabase di setiap proyek; diperiksa dulu supaya
  -- migration tidak gagal di database yang belum punya publikasi itu.
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'packages'
  ) then
    alter publication supabase_realtime add table public.packages;
  end if;
end;
$$;
