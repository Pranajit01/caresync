-- =============================================================================
-- CareSync Phase 3 — FIXUP + SEED
-- Run this against a project where the base schema tables already exist
-- but are missing lat/lon columns and all seed data.
-- =============================================================================

-- ── Fix missing columns on hospitals ─────────────────────────────────────
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS latitude  double precision NOT NULL DEFAULT 0;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS longitude double precision NOT NULL DEFAULT 0;

-- ── Auto-profile trigger (create/replace) ─────────────────────────────────
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
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Helper functions ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_hospital_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT hospital_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ── Realtime ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='queue_state') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_state; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='beds') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beds; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='appointments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; END IF;
END$$;

-- ── Seed: Hospitals ───────────────────────────────────────────────────────
INSERT INTO public.hospitals (id, name, address, latitude, longitude) VALUES
  ('a1000000-0000-0000-0000-000000000001','Apollo Multispecialty Hospitals','58 Canal Circular Rd, Kankurgachi, Kolkata 700054',22.5800,88.4200),
  ('a2000000-0000-0000-0000-000000000002','AMRI Hospitals Mukundapur','JC-16/17, Sector III, Salt Lake City, Kolkata 700098',22.5000,88.3900),
  ('a3000000-0000-0000-0000-000000000003','Fortis Hospital Anandapur','730 Anandapur, E M Bypass, Kolkata 700107',22.5000,88.4000),
  ('a4000000-0000-0000-0000-000000000004','CMRI (Calcutta Medical Research Institute)','7/2 Diamond Harbour Rd, Kolkata 700027',22.5300,88.3500),
  ('a5000000-0000-0000-0000-000000000005','Belle Vue Clinic','9 Dr UN Brahmachari St, Minto Park, Kolkata 700017',22.5400,88.3500)
ON CONFLICT (id) DO UPDATE SET latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, name=EXCLUDED.name;

-- ── Seed: Doctors ─────────────────────────────────────────────────────────
INSERT INTO public.doctors (id, hospital_id, full_name, specialization) VALUES
  ('d1010000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Arindam Sen','Cardiology'),
  ('d1020000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Priya Mukherjee','General Medicine'),
  ('d1030000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Rajat Banerjee','Orthopedics'),
  ('d1040000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Soma Chakrabarti','Dermatology'),
  ('d1050000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Tapas Bose','Pulmonology'),
  ('d1060000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Dr. Nilufar Hossain','Endocrinology'),
  ('d2010000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Sourav Chatterjee','Gynecology'),
  ('d2020000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Ananya Roy','Pediatrics'),
  ('d2030000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Partha Ghosh','Cardiology'),
  ('d2040000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Ruma Das','Neurology'),
  ('d2050000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Abhijit Pal','General Surgery'),
  ('d2060000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Dr. Sreeja Biswas','Ophthalmology'),
  ('d3010000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Debjani Ghosh','Neurology'),
  ('d3020000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Kunal Dasgupta','ENT'),
  ('d3030000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Mitali Sengupta','Orthopedics'),
  ('d3040000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Arnab Majumdar','Cardiology'),
  ('d3050000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Dr. Priyanka Dutta','General Medicine'),
  ('d4010000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Subrata Mondal','General Surgery'),
  ('d4020000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Tanushree Nandi','Pediatrics'),
  ('d4030000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Bikash Saha','Urology'),
  ('d4040000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Chandana Mitra','Gynecology'),
  ('d4050000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','Dr. Samir Kundu','Pulmonology'),
  ('d5010000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Ritwik Sarkar','Dermatology'),
  ('d5020000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Mousumi Bhattacharya','Endocrinology'),
  ('d5030000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Sanjib Haldar','Cardiology'),
  ('d5040000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Rachna Agarwal','General Medicine'),
  ('d5050000-0000-0000-0000-000000000005','a5000000-0000-0000-0000-000000000005','Dr. Prosenjit Das','Orthopedics')
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Beds ────────────────────────────────────────────────────────────
INSERT INTO public.beds (hospital_id, ward_type, total_beds, available_beds, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001','General',140,32,now()),
  ('a1000000-0000-0000-0000-000000000001','ICU',28,6,now()),
  ('a1000000-0000-0000-0000-000000000001','Emergency',18,7,now()),
  ('a2000000-0000-0000-0000-000000000002','General',120,25,now()),
  ('a2000000-0000-0000-0000-000000000002','ICU',24,4,now()),
  ('a2000000-0000-0000-0000-000000000002','Emergency',15,5,now()),
  ('a3000000-0000-0000-0000-000000000003','General',100,18,now()),
  ('a3000000-0000-0000-0000-000000000003','ICU',20,3,now()),
  ('a3000000-0000-0000-0000-000000000003','Emergency',14,8,now()),
  ('a4000000-0000-0000-0000-000000000004','General',90,14,now()),
  ('a4000000-0000-0000-0000-000000000004','ICU',18,2,now()),
  ('a4000000-0000-0000-0000-000000000004','Emergency',12,4,now()),
  ('a5000000-0000-0000-0000-000000000005','General',85,21,now()),
  ('a5000000-0000-0000-0000-000000000005','ICU',16,5,now()),
  ('a5000000-0000-0000-0000-000000000005','Emergency',10,3,now());
