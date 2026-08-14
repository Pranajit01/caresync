-- =============================================================================
-- CareSync Phase 3 — COMPLETE SETUP (schema + RLS + seed)
-- Paste this entire file into:
--   Supabase Dashboard → SQL Editor → New Query → Run (Ctrl+Enter)
--
-- Safe to run on a fresh project. Re-running is safe (IF NOT EXISTS).
-- =============================================================================

-- MOCK DEMO DATA NOTICE (applies to seed section):
-- Hospital names and locations are real Kolkata institutions from public listings.
-- All doctors, bed numbers, and OPD data are invented for demo purposes only.
-- Source: CareSync PROJECT_RULES.md Appendix A

-- ---------------------------------------------------------------------------
-- HELPER: get calling user's role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- HELPER: get calling user's hospital_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_hospital_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT hospital_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- TABLE 1: users  (Section 5 — exact columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'patient'
                CHECK (role IN ('patient', 'hospital_admin', 'super_admin')),
  hospital_id uuid,
  phone       text NOT NULL DEFAULT ''
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own"        ON public.users;
DROP POLICY IF EXISTS "users_update_own"        ON public.users;
DROP POLICY IF EXISTS "users_select_superadmin" ON public.users;

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_select_superadmin"
  ON public.users FOR SELECT USING (public.get_my_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- TABLE 2: hospitals  (Section 5 — exact columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospitals (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  address   text NOT NULL DEFAULT '',
  latitude  double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0
);
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Add FK from users.hospital_id → hospitals now that hospitals exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_hospital_id_fkey'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_hospital_id_fkey
      FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL;
  END IF;
END$$;

DROP POLICY IF EXISTS "hospitals_select_public"    ON public.hospitals;
DROP POLICY IF EXISTS "hospitals_insert_superadmin" ON public.hospitals;
DROP POLICY IF EXISTS "hospitals_update_superadmin" ON public.hospitals;

CREATE POLICY "hospitals_select_public"
  ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "hospitals_insert_superadmin"
  ON public.hospitals FOR INSERT WITH CHECK (public.get_my_role() = 'super_admin');
CREATE POLICY "hospitals_update_superadmin"
  ON public.hospitals FOR UPDATE USING (public.get_my_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- TABLE 3: doctors  (Section 5 — exact columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id    uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  full_name      text NOT NULL,
  specialization text NOT NULL DEFAULT ''
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_select_public"     ON public.doctors;
DROP POLICY IF EXISTS "doctors_insert_superadmin" ON public.doctors;
DROP POLICY IF EXISTS "doctors_update_superadmin" ON public.doctors;

CREATE POLICY "doctors_select_public"
  ON public.doctors FOR SELECT USING (true);
CREATE POLICY "doctors_insert_superadmin"
  ON public.doctors FOR INSERT WITH CHECK (public.get_my_role() = 'super_admin');
CREATE POLICY "doctors_update_superadmin"
  ON public.doctors FOR UPDATE USING (public.get_my_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- TABLE 4: appointments  (Section 5 — exact columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id        uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_id      uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  appointment_date date NOT NULL DEFAULT CURRENT_DATE,
  token_number     integer NOT NULL,
  status           text NOT NULL DEFAULT 'booked'
                     CHECK (status IN ('booked', 'in_progress', 'completed', 'cancelled')),
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select_own"             ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_patient"         ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_patient"         ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_admin_hospital"  ON public.appointments;

-- patient: see/write only their own rows
CREATE POLICY "appointments_select_own"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() = patient_id
    OR public.get_my_role() IN ('hospital_admin', 'super_admin')
  );
CREATE POLICY "appointments_insert_patient"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "appointments_update_patient"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- hospital_admin: update appointments in their own hospital
CREATE POLICY "appointments_update_admin_hospital"
  ON public.appointments FOR UPDATE
  USING (
    public.get_my_role() = 'hospital_admin'
    AND hospital_id = public.get_my_hospital_id()
  );

-- ---------------------------------------------------------------------------
-- TABLE 5: queue_state  (Section 5 — exact columns, composite PK for multi-day)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.queue_state (
  doctor_id         uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  date              date NOT NULL DEFAULT CURRENT_DATE,
  now_serving_token integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, date)
);
ALTER TABLE public.queue_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "queue_state_select_authenticated" ON public.queue_state;
DROP POLICY IF EXISTS "queue_state_insert_admin"         ON public.queue_state;
DROP POLICY IF EXISTS "queue_state_update_admin"         ON public.queue_state;

CREATE POLICY "queue_state_select_authenticated"
  ON public.queue_state FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "queue_state_insert_admin"
  ON public.queue_state FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'hospital_admin'
    AND (SELECT hospital_id FROM public.doctors WHERE id = doctor_id)
        = public.get_my_hospital_id()
  );
CREATE POLICY "queue_state_update_admin"
  ON public.queue_state FOR UPDATE
  USING (
    public.get_my_role() = 'hospital_admin'
    AND (SELECT hospital_id FROM public.doctors WHERE id = doctor_id)
        = public.get_my_hospital_id()
  );

-- ---------------------------------------------------------------------------
-- TABLE 6: beds  (Section 5 — exact columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beds (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id    uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  ward_type      text NOT NULL CHECK (ward_type IN ('ICU', 'General', 'Emergency')),
  total_beds     integer NOT NULL CHECK (total_beds >= 0),
  available_beds integer NOT NULL CHECK (available_beds >= 0),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beds_select_public"             ON public.beds;
DROP POLICY IF EXISTS "beds_update_admin_own_hospital" ON public.beds;

CREATE POLICY "beds_select_public"
  ON public.beds FOR SELECT USING (true);
CREATE POLICY "beds_update_admin_own_hospital"
  ON public.beds FOR UPDATE
  USING (
    public.get_my_role() = 'hospital_admin'
    AND hospital_id = public.get_my_hospital_id()
  );

-- ---------------------------------------------------------------------------
-- AUTO-PROFILE TRIGGER
-- On every new Supabase Auth signup, copy user_metadata into public.users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role, hospital_id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    CASE
      WHEN (NEW.raw_user_meta_data->>'hospital_id') IS NOT NULL
       AND (NEW.raw_user_meta_data->>'hospital_id') <> ''
      THEN (NEW.raw_user_meta_data->>'hospital_id')::uuid
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- REALTIME  (enable live subscriptions for Phase 5)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- queue_state
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'queue_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_state;
  END IF;
  -- beds
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'beds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;
  END IF;
  -- appointments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END$$;


-- =============================================================================
-- SEED DATA — MOCK DEMO DATA. Not real hospital data. For hackathon/demo only.
-- =============================================================================

-- ── Hospitals ─────────────────────────────────────────────────────────────
INSERT INTO public.hospitals (id, name, address, latitude, longitude) VALUES
  ('a1000000-0000-0000-0000-000000000001','Apollo Multispecialty Hospitals',
   '58 Canal Circular Rd, Kankurgachi, Kolkata 700054', 22.5800, 88.4200),
  ('a2000000-0000-0000-0000-000000000002','AMRI Hospitals Mukundapur',
   'JC-16/17, Sector III, Salt Lake City, Kolkata 700098', 22.5000, 88.3900),
  ('a3000000-0000-0000-0000-000000000003','Fortis Hospital Anandapur',
   '730 Anandapur, E M Bypass, Kolkata 700107', 22.5000, 88.4000),
  ('a4000000-0000-0000-0000-000000000004','CMRI (Calcutta Medical Research Institute)',
   '7/2 Diamond Harbour Rd, Kolkata 700027', 22.5300, 88.3500),
  ('a5000000-0000-0000-0000-000000000005','Belle Vue Clinic',
   '9 Dr UN Brahmachari St, Minto Park, Kolkata 700017', 22.5400, 88.3500)
ON CONFLICT (id) DO NOTHING;

-- ── Mock Doctors (5–6 per hospital, names are fictional) ──────────────────
INSERT INTO public.doctors (id, hospital_id, full_name, specialization) VALUES
  -- Apollo (6)
  ('d1010000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Arindam Sen','Cardiology'),
  ('d1020000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Priya Mukherjee','General Medicine'),
  ('d1030000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Rajat Banerjee','Orthopedics'),
  ('d1040000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Soma Chakrabarti','Dermatology'),
  ('d1050000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Tapas Bose','Pulmonology'),
  ('d1060000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Nilufar Hossain','Endocrinology'),
  -- AMRI (6)
  ('d2010000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Sourav Chatterjee','Gynecology'),
  ('d2020000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Ananya Roy','Pediatrics'),
  ('d2030000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Partha Ghosh','Cardiology'),
  ('d2040000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Ruma Das','Neurology'),
  ('d2050000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Abhijit Pal','General Surgery'),
  ('d2060000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Sreeja Biswas','Ophthalmology'),
  -- Fortis (5)
  ('d3010000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Debjani Ghosh','Neurology'),
  ('d3020000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Kunal Dasgupta','ENT'),
  ('d3030000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Mitali Sengupta','Orthopedics'),
  ('d3040000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Arnab Majumdar','Cardiology'),
  ('d3050000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Priyanka Dutta','General Medicine'),
  -- CMRI (5)
  ('d4010000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Subrata Mondal','General Surgery'),
  ('d4020000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Tanushree Nandi','Pediatrics'),
  ('d4030000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Bikash Saha','Urology'),
  ('d4040000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Chandana Mitra','Gynecology'),
  ('d4050000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Samir Kundu','Pulmonology'),
  -- Belle Vue (5)
  ('d5010000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Ritwik Sarkar','Dermatology'),
  ('d5020000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Mousumi Bhattacharya','Endocrinology'),
  ('d5030000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Sanjib Haldar','Cardiology'),
  ('d5040000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Rachna Agarwal','General Medicine'),
  ('d5050000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Prosenjit Das','Orthopedics')
ON CONFLICT (id) DO NOTHING;

-- ── Bed Availability (3 wards × 5 hospitals = 15 rows) ────────────────────
-- General: total 80–150, available 10–40
-- ICU:     total 15–30,  available 1–8
-- Emergency: total 10–20, available 2–10
INSERT INTO public.beds (hospital_id, ward_type, total_beds, available_beds, updated_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001','General',   140, 32, now()),
  ('a1000000-0000-0000-0000-000000000001','ICU',        28,  6, now()),
  ('a1000000-0000-0000-0000-000000000001','Emergency',  18,  7, now()),
  ('a2000000-0000-0000-0000-000000000002','General',   120, 25, now()),
  ('a2000000-0000-0000-0000-000000000002','ICU',        24,  4, now()),
  ('a2000000-0000-0000-0000-000000000002','Emergency',  15,  5, now()),
  ('a3000000-0000-0000-0000-000000000003','General',   100, 18, now()),
  ('a3000000-0000-0000-0000-000000000003','ICU',        20,  3, now()),
  ('a3000000-0000-0000-0000-000000000003','Emergency',  14,  8, now()),
  ('a4000000-0000-0000-0000-000000000004','General',    90, 14, now()),
  ('a4000000-0000-0000-0000-000000000004','ICU',        18,  2, now()),
  ('a4000000-0000-0000-0000-000000000004','Emergency',  12,  4, now()),
  ('a5000000-0000-0000-0000-000000000005','General',    85, 21, now()),
  ('a5000000-0000-0000-0000-000000000005','ICU',        16,  5, now()),
  ('a5000000-0000-0000-0000-000000000005','Emergency',  10,  3, now());
