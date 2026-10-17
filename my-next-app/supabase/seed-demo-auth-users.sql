-- ============================================================================
-- seed-demo-auth-users.sql  (OPSIONAL - bukan migration, tidak otomatis jalan)
--
-- Dipakai HANYA bila supabase/migrations/20261017_fix_auth_admin_users_500.sql
-- sudah dijalankan tetapi `npm run seed:demo` masih 500 dari Supabase Auth
-- (admin API proyek mati total). Script ini membuat akun login demo langsung di
-- auth.users memakai bcrypt dari pgcrypto, jadi tidak menyentuh /auth/v1/admin.
--
-- Cara pakai: Supabase SQL Editor -> tempel seluruh isi -> Run. Idempoten:
-- email/uuid yang sudah ada tidak diubah dan kata sandi tidak ditimpa.
--
-- Setelah akun terbentuk, login aplikasi memakai:
--   DemoUmroh2026!   (ganti secepatnya; kata sandi ini ada di file contoh publik)
--
-- Catatan: GoTrue mengharapkan satu baris auth.identities per akun email. Itu
-- dibuat di bawah; bila struktur identitas proyek berbeda, bagian itu dilewati
-- dengan NOTICE dan login tetap berjalan (GoTrue membaca auth.users by email).
-- ============================================================================

-- pgcrypto di Supabase tinggal di skema `extensions`; tambahkan ke search_path
-- supaya crypt()/gen_salt()/gen_random_uuid() bisa dipakai tanpa prefix.
set search_path = "$user", public, extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_pw constant text := 'DemoUmroh2026!';
  r record;
  v_exists boolean;
  accounts jsonb := $accounts$
  [
    { "id": "44444444-4444-4444-4444-444444444401", "email": "superadmin@almadinah.id",
      "full_name": "Ustadz Al-Hafidz", "role": "super_admin" },
    { "id": "55555555-5555-5555-5555-555555555501", "email": "admin.cabang@almadinah.id",
      "full_name": "Rizky Darmawan", "role": "admin_cabang" },
    { "id": "22222222-2222-2222-2222-222222222202", "email": "agen@example.com",
      "full_name": "Hasan Basri (Mitra Agen)", "role": "mitra_agen" },
    { "id": "33333333-3333-3333-3333-333333333301", "email": "muthawif@example.com",
      "full_name": "Ustadz Abdullah (Muthawif)", "role": "muthawif" },
    { "id": "11111111-1111-1111-1111-111111111104", "email": "jamaah@example.com",
      "full_name": "Ahmad Fauzi", "role": "jamaah" }
  ]
  $accounts$::jsonb;
begin
  for r in
    select (elem ->> 'id')::uuid as id,
           elem ->> 'email'      as email,
           elem ->> 'full_name'  as full_name,
           elem ->> 'role'       as role
      from jsonb_array_elements(accounts) as elem
  loop
    select exists (select 1 from auth.users u where u.id = r.id or u.email = r.email)
      into v_exists;

    if v_exists then
      raise notice 'lewat: akun % sudah ada', r.email;
      continue;
    end if;

    insert into auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at,
      confirmation_token, recovery_token,
      email_change, email_change_token_new, email_change_token_current,
      email_change_confirm_status, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at
    ) values (
      r.id, 'authenticated', 'authenticated', r.email, crypt(v_pw, gen_salt('bf', 10)),
      timezone('utc', now()),
      '', '',
      '', '', '',
      0, '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', r.full_name, 'role', r.role, 'sub', r.id::text),
      false, timezone('utc', now()), timezone('utc', now())
    );

    raise notice 'AKUN LOGIN DIBUAT: % (%)', r.email, r.role;
  end loop;
end $$;

-- Identitas email per akun (dibungkai exception karena bentuk tabelnya beda
-- antar versi GoTrue).
do $$
declare
  r record;
begin
  for r in
    select u.id, u.email
      from auth.users u
     where u.email in (
       'superadmin@almadinah.id', 'admin.cabang@almadinah.id',
       'agen@example.com', 'muthawif@example.com', 'jamaah@example.com'
     )
  loop
    begin
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        r.id,
        jsonb_build_object('sub', r.id::text, 'email', r.email, 'email_verified', true),
        'email',
        r.id::text,
        timezone('utc', now()),
        timezone('utc', now()),
        timezone('utc', now())
      )
      on conflict (provider_id, provider) do nothing;
    exception when others then
      raise notice 'identitas untuk % dilewati (%)', r.email, sqlerrm;
    end;
  end loop;
end $$;

-- Profil: pastikan barisnya memakai UUID yang sama dengan akun login.
do $$
declare
  r record;
  v_branch uuid;
begin
  select id into v_branch from public.branches where code = 'JKT' limit 1;

  for r in
    select u.id, u.email,
           u.raw_user_meta_data ->> 'full_name' as full_name,
           u.raw_user_meta_data ->> 'role'      as role
      from auth.users u
     where u.email in (
       'superadmin@almadinah.id', 'admin.cabang@almadinah.id',
       'agen@example.com', 'muthawif@example.com', 'jamaah@example.com'
     )
  loop
    insert into public.profiles (id, email, full_name, role, branch_id, is_active)
    values (r.id, r.email, r.full_name, r.role, v_branch, true)
    on conflict (id) do update set
      email      = excluded.email,
      full_name  = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
      role       = coalesce(nullif(excluded.role, ''), public.profiles.role),
      branch_id  = coalesce(public.profiles.branch_id, excluded.branch_id),
      is_active  = true,
      updated_at = timezone('utc', now());
  end loop;

  -- Portal agen & muthawif membaca data lewat agents.user_id / guides.user_id.
  update public.agents a set user_id = p.id
    from public.profiles p
   where p.email = 'agen@example.com' and a.email = p.email and a.user_id is distinct from p.id;

  update public.guides g set user_id = p.id
    from public.profiles p
   where p.email = 'muthawif@example.com' and g.email = p.email and g.user_id is distinct from p.id;
end $$;

-- Cek hasil.
select u.email,
       (u.email_confirmed_at is not null) as confirmed,
       p.role,
       p.id as profile_id
  from auth.users u
  left join public.profiles p on p.id = u.id
 where u.email in (
   'superadmin@almadinah.id', 'admin.cabang@almadinah.id',
   'agen@example.com', 'muthawif@example.com', 'jamaah@example.com'
 )
 order by u.email;
