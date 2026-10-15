-- ==============================================================================
-- Seed: default data derived from code defaults (systemSettingsService.ts:33-60,
-- bankAccountService usage). Idempotent.
-- ==============================================================================

insert into public.system_settings (id, travel_name, company_legal_name, ppiu_number, pihk_number,
  accreditation, established_year, support_phone, support_email, website_url, head_office_address)
values
  ('default_settings', 'Al-Madinah Travel', 'PT Al-Madinah Wisata Syariah',
   'Kemenag RI No. U.412 Tahun 2021', 'Kemenag RI No. HK.108 Tahun 2023',
   'Akreditasi A (Sangat Baik)', '2016', '0812-9900-1122',
   'layanan@almedinahtravel.com', 'https://almedinahtravel.com',
   'Jl. M.H. Thamrin No. 12, Menteng, Jakarta Pusat 10350')
on conflict (id) do update set
  travel_name = excluded.travel_name,
  company_legal_name = excluded.company_legal_name;

-- Mark the Jakarta HQ branch (cabang/page.tsx sets is_headquarter for "Kantor Pusat")
update public.branches set is_headquarter = true where code = 'JKT' and is_headquarter = false;
