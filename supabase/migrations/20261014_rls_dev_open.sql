-- ============================================================================
-- RLS FIX (dev mode): pastikan SEMUA tabel bisa insert oleh anon + authenticated
-- ============================================================================

-- A. Enable RLS semua tabel public
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- B. Drop SEMUA policy lama (bersih, tanpa konflik)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT tablename, policyname FROM pg_policies WHERE schemaname='public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- C. Policy UNIVERSAL full-access utk anon + authenticated (+ service_role tetap boleh)
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format(
      'CREATE POLICY "dev_all_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      tbl, tbl);
  END LOOP;
END $$;

-- D. GRANT permission (RLS saja tidak cukup)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- E. Pastikan schema public bisa diakses (idempotent dgn D)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
