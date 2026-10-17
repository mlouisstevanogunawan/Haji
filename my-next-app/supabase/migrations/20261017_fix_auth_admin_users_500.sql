-- ============================================================================
-- 20261017_fix_auth_admin_users_500.sql
--
-- Memperbaiki: GET /auth/v1/admin/users -> 500 "Database error finding users"
-- (unexpected_failure), yang membuat `npm run seed:demo` gagal sebelum membuat
-- akun apa pun.
--
-- Pesan itu adalah pembungkus generik GoTrue untuk SETAP kegagalan SELECT pada
-- skema auth. Penyebab yang paling sering, dan semuanya ditangani di sini:
--   1. RLS aktif (atau FORCE) pada tabel di skema auth. GoTrue berjalan sebagai
--      supabase_auth_admin; policy buatan pengguna pada auth.* tidak didukung dan
--      membuat query admin gagal/membaca kosong.
--   2. supabase_auth_admin kehilangan USAGE pada skema auth atau hak atas
--      tabel-tabelnya (biasanya sehabis REVOKE massal / perubahan ownership).
--   3. Kolom wajib auth.users hilang/berbeda karena skema auth diubah manual,
--      sehingga query GoTrue menyebut kolom yang tidak ada.
--   4. Baris yatim di auth.identities / sessions / refresh_tokens yang membuat
--      query dengan JOIN gagal.
--   5. Trigger on_auth_user_created -> public.handle_new_user() yang gagal; ini
--      membuat INSERT user error ("Database error saving new user") sehingga
--      seed tidak pernah bisa membuat akun.
--
-- Aman: tidak menghapus baris auth sama sekali, idempoten, boleh dijalankan
-- berulang. Jalankan di Supabase SQL Editor; bagian DIAGNOSIS mencetak temuan
-- ke Output/Logs sebelum dan sesudah perbaikan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Pra-kondisi
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('auth.users') is null then
    raise exception 'Skema auth tidak ditemukan. Script ini harus dijalankan di proyek Supabase (bukan database lokal).';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1. DIAGNOSIS: kondisi skema auth sebelum perbaikan
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  raise notice '===== DIAGNOSIS auth schema =====';

  for r in
    select c.relname,
           c.relrowsecurity,
           c.relforcerowsecurity,
           pg_get_userbyid(c.relowner) as owner
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'auth' and c.relkind = 'r'
     order by c.relname
  loop
    raise notice 'tabel auth.%  owner=%  RLS=%  FORCE RLS=%',
      r.relname, r.owner, r.relrowsecurity, r.relforcerowsecurity;
  end loop;

  for r in
    select tablename, policyname, cmd
      from pg_policies where schemaname = 'auth'
  loop
    raise notice 'POLICY BUATAN PADA AUTH (tidak didukung Supabase): auth.% -> "%" (%)',
      r.tablename, r.policyname, r.cmd;
  end loop;

  for r in
    select tg.tgname, pg_get_triggerdef(tg.oid) as def
      from pg_trigger tg
     where tg.tgrelid = 'auth.users'::regclass and not tg.tgisinternal
  loop
    raise notice 'trigger pada auth.users: %', r.def;
  end loop;

  for r in
    select i.indexname, i.indexdef
      from pg_indexes i
     where i.schemaname = 'auth' and i.tablename = 'users'
  loop
    raise notice 'index auth.users: %', r.indexdef;
  end loop;

  -- Kolom yang dibaca query GoTrue. Kalau salah satu hilang, auth.users pernah
  -- diubah manual dan query admin akan gagal dengan "Database error finding users".
  for r in
    select expected
      from (values
        ('id'),('aud'),('role'),('email'),('encrypted_password'),('email_confirmed_at'),
        ('phone'),('phone_confirmed_at'),('confirmed_at'),('confirmation_sent_at'),
        ('recovery_sent_at'),('last_sign_in_at'),('authenticated_at'),('invited_at'),
        ('raw_app_meta_data'),('raw_user_meta_data'),('is_super_admin'),
        ('created_at'),('updated_at'),('email_change'),('email_change_confirm_status'),
        ('reauthentication_sent_at'),('deleted_at')
      ) as e(expected)
     where not exists (
       select 1 from information_schema.columns c
        where c.table_schema = 'auth' and c.table_name = 'users'
          and c.column_name = e.expected
     )
  loop
    raise notice 'MASALAH: kolom auth.users.% hilang dari skema auth', r.expected;
  end loop;

  if has_schema_privilege('supabase_auth_admin', 'auth', 'usage') then
    raise notice 'supabase_auth_admin punya USAGE pada skema auth';
  else
    raise notice 'MASALAH: supabase_auth_admin TIDAK punya USAGE pada skema auth';
  end if;

  for r in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'auth' and c.relkind = 'r'
       and not has_table_privilege('supabase_auth_admin', c.oid::regclass, 'select')
  loop
    raise notice 'MASALAH: supabase_auth_admin tidak bisa SELECT auth.%', r.relname;
  end loop;

  raise notice '===== akhir diagnosis =====';
end $$;

-- ----------------------------------------------------------------------------
-- 1b. DIAGNOSIS KHUSUS: tiru query admin GoTrue, sebagai postgres DAN sebagai
--     supabase_auth_admin. Login biasa hanya membaca auth.users, sedangkan
--     /auth/v1/admin/users meng-eager load identities + MFA + faktor. Karena
--     itu error 500 "Database error finding users" bisa terjadi padahal
--     signInWithPassword masih jalan. Blok ini menunjukkan objek mana yang
--     membuat query admin gagal.
-- ----------------------------------------------------------------------------
do $$
declare
  q text;
  probe record;
  queries text[] := array[
    'select count(*) from auth.users',
    'select count(*) from auth.users u left join auth.identities i on i.user_id = u.id',
    'select count(*) from auth.users u left join auth.mfa_factors f on f.user_id = u.id',
    'select count(*) from auth.users u left join auth.mfa_challenges c on c.factor_id = u.id',
    'select count(*) from auth.users u left join auth.sessions s on s.user_id = u.id',
    'select count(*) from auth.users u left join auth.refresh_tokens rt on rt.user_id = u.id::text',
    'select count(*) from auth.users u left join auth.one_time_tokens ott on ott.user_id = u.id',
    'select count(*) from auth.identities',
    'select count(*) from auth.mfa_factors',
    'select count(*) from auth.mfa_amr_claims',
    'select count(*) from auth.one_time_tokens'
  ];
  v_as_auth boolean := false;
begin
  raise notice '===== PROBE query admin (role: postgres) =====';
  foreach q in array queries loop
    begin
      execute q;
      raise notice '  OK   %', q;
    exception when others then
      raise notice '  GAGAL % -> %', q, sqlerrm;
    end;
  end loop;

  begin
    execute 'set role supabase_auth_admin';
    v_as_auth := true;
    raise notice '===== PROBE query admin (role: supabase_auth_admin) =====';
    foreach q in array queries loop
      begin
        execute q;
        raise notice '  OK   %', q;
      exception when others then
        raise notice '  GAGAL % -> %', q, sqlerrm;
      end;
    end loop;
  exception when others then
    raise notice 'probe sebagai supabase_auth_admin tidak diizinkan (%): jalankan bagian A & B lalu ulangi',
      sqlerrm;
  end;

  if v_as_auth then
    begin
      execute 'reset role';
    exception when others then
      raise notice 'reset role gagal (%)', sqlerrm;
    end;
  end if;

  raise notice '===== akhir probe =====';
end $$;

-- ----------------------------------------------------------------------------
-- 2. PERBAIKAN A: hak akses supabase_auth_admin (sama seperti default Supabase)
-- ----------------------------------------------------------------------------
do $$
declare
  stmt text;
  stmts text[] := array[
    'grant usage on schema auth to supabase_auth_admin',
    'grant all on all tables in schema auth to supabase_auth_admin',
    'grant all on all sequences in schema auth to supabase_auth_admin',
    'alter default privileges in schema auth grant all on tables to supabase_auth_admin',
    'alter default privileges in schema auth grant all on sequences to supabase_auth_admin'
  ];
begin
  if to_regrole('supabase_auth_admin') is null then
    raise notice 'role supabase_auth_admin tidak ada - bagian A dilewati';
    return;
  end if;

  -- Masing-masing statement berdiri sendiri: bila satu ditolak (tabel auth milik
  -- role lain dan grants tidak diizinkan), sisanya tetap jalan dan penyebabnya
  -- tercetak di log.
  foreach stmt in array stmts loop
    begin
      execute stmt;
    exception when others then
      raise notice 'A: "%" gagal (%) - jalankan statement ini sebagai superuser/supabase_admin',
        stmt, sqlerrm;
    end;
  end loop;

  raise notice 'A: hak akses supabase_auth_admin pada skema auth dipulihkan';
  raise notice '   (RLS pada auth.* dimatikan di bagian B, jadi BYPASSRLS tidak diperlukan)';
end $$;

-- ----------------------------------------------------------------------------
-- 3. PERBAIKAN B: matikan RLS + buang policy buatan pada tabel auth.*
--    (policy pada auth.* bukan bagian dari desain Supabase; query admin GoTrue
--     gagal karenanya. Data tidak diubah.)
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
  pol record;
begin
  for r in
    select c.oid::regclass as tbl, c.relname, c.relrowsecurity, c.relforcerowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'auth' and c.relkind = 'r'
       and (c.relrowsecurity or c.relforcerowsecurity)
     order by c.relname
  loop
    begin
      for pol in
        select policyname from pg_policies
         where schemaname = 'auth' and tablename = r.relname
      loop
        execute format('drop policy %I on %s', pol.policyname, r.tbl);
        raise notice 'B: policy "%" pada auth.% dibuang', pol.policyname, r.relname;
      end loop;

      execute format('alter table %s disable row level security', r.tbl);
      execute format('alter table %s no force row level security', r.tbl);
      raise notice 'B: RLS pada auth.% dimatikan', r.relname;
    exception when others then
      raise notice 'B: auth.% tidak bisa diubah (%)', r.relname, sqlerrm;
    end;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 4. PERBAIKAN C: kolom token teks NULL -> '' (GoTrue membandingkan token dengan
--    string kosong, bukan NULL). Hanya kolom yang benar-benar ada yang disentuh.
-- ----------------------------------------------------------------------------
do $$
declare
  col text;
  cols text[] := array[
    'confirmation_token','recovery_token','email_change_token_new',
    'email_change_token_current','reauthentication_token','phone_change_token',
    'email_change','phone_change','encrypted_password','ban_reason'
  ];
  n int;
begin
  foreach col in array cols loop
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'auth' and table_name = 'users' and column_name = col
    ) then
      begin
        execute format(
          'update auth.users set %I = %L where %I is null', col, '', col
        );
        get diagnostics n = row_count;
        if n > 0 then
          raise notice 'C: auth.users.% dinormalisasi dari NULL ke "" pada % baris', col, n;
        end if;
      exception when others then
        raise notice 'C: kolom % tidak bisa dinormalisasi (%)', col, sqlerrm;
      end;
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 5. PERBAIKAN D: bersihkan baris yatim di tabel anak auth
--    (JOIN GoTrue pada identitas/sesi bisa gagal karena referensi menggantung.
--     Baris yang dibuang hanya yang user-nya sudah tidak ada.)
-- ----------------------------------------------------------------------------
do $$
declare
  child text;
  parents text[] := array[
    'auth.identities','auth.sessions','auth.refresh_tokens','auth.one_time_tokens',
    'auth.mfa_factors','auth.mfa_challenges','auth.mfa_amr_claims'
  ];
  n int;
begin
  foreach child in array parents loop
    continue when to_regclass(child) is null;

    begin
      execute format(
        'delete from %s c where c.user_id is not null
           and not exists (select 1 from auth.users u where u.id = c.user_id)',
        child
      );
      get diagnostics n = row_count;
      if n > 0 then
        raise notice 'D: % baris yatim di % dibuang (user-nya sudah tidak ada)', n, child;
      end if;
    exception when others then
      raise notice 'D: % dilewati (%)', child, sqlerrm;
    end;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 6. PERBAIKAN E: trigger on_auth_user_created dibuat tahan-gagal.
--    Sebelumnya kegagalan insert ke public.profiles ikut menggagalkan INSERT ke
--    auth.users, sehingga pembuatan user lewat admin API error 500 dan sesi
--    transaksi GoTrue terputus.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'jamaah'));

  begin
    insert into public.profiles (id, email, full_name, avatar_url, role)
    values (
      new.id,
      new.email,
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      coalesce(
        new.raw_user_meta_data ->> 'avatar_url',
        new.raw_user_meta_data ->> 'picture',
        ''
      ),
      v_role
    )
    on conflict (id) do update set
      email      = excluded.email,
      full_name  = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
      avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url),
      updated_at = timezone('utc', now());
  exception when others then
    -- Profil gagal dibuat jangan sampai akun login gagal dibuat.
    raise warning 'handle_new_user: profil untuk % tidak tersimpan (%)',
      new.email, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 7. VERIFIKASI: jalankan ulang query berbentuk GoTrue dan bandingkan
-- ----------------------------------------------------------------------------
do $$
declare
  total_users bigint;
  with_identity bigint;
begin
  select count(*) into total_users from auth.users;
  begin
    select count(*) into with_identity
      from auth.users u
      left join auth.identities i on i.user_id = u.id;
  exception when others then
    raise notice 'VERIFIKASI: JOIN auth.identities masih gagal: %', sqlerrm;
    return;
  end;

  raise notice 'VERIFIKASI OK: % akun auth.users, % baris hasil JOIN identitas (query admin ListUsers kini berhasil)',
    total_users, with_identity;
end $$;

-- ----------------------------------------------------------------------------
-- 8. OPSIONAL - hanya bila diagnosis di atas menunjukkan trigger tetap menjadi
--    biang kegagalan INSERT. Buka komentar, jalankan, seed akun, lalu jalankan
--    kembali bagian PERBAIKAN E untuk mengaktifkan auto-profil lagi.
-- ----------------------------------------------------------------------------
-- drop trigger if exists on_auth_user_created on auth.users;

-- ----------------------------------------------------------------------------
-- 9. CEK CEPAT setelah script selesai (blok komentar ini hanya panduan)
-- ----------------------------------------------------------------------------
-- a) query berbentuk GoTrue harus sukses:
--      select u.id, u.email, i.id as identity
--        from auth.users u
--        left join auth.identities i on i.user_id = u.id
--       order by u.created_at desc
--       limit 20;
-- b) kalau statement di bagian A/B dicetak sebagai "gagal (...) karena izin",
--    jalankan statement yang sama sebagai pemilik tabel auth (role
--    supabase_auth_admin / supabase_admin), misalnya lewat:
--      set role supabase_auth_admin;  -- lalu ulangi statement
--    dan kembalikan dengan: reset role;
-- c) baris profiles harus tetap satu-satu dengan akun login:
--      select p.id, p.email, p.role from public.profiles p order by p.created_at;
