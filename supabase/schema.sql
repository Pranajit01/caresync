-- =============================================================================
-- CareSync — Database Schema
-- Section 5: Tables, RLS, and Access Policies
-- Apply this ONCE against your Supabase project via the SQL Editor or a
-- migration tool. Re-running is safe (uses IF NOT EXISTS / CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: get the calling user's role from the public.users table.
-- Used in RLS policies below. Wrapped in SECURITY DEFINER so it can always
-- read public.users regardless of the caller's privileges.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: get the calling user's hospital_id from public.users.
-- Used by hospital_admin policies to scope writes to their own hospital.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_hospital_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hospital_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- AUTO-PROFILE TRIGGER
-- When a new user signs up via Supabase Auth, automatically insert their
-- profile row into public.users using the metadata supplied at signup.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Drop and recreate trigger to ensure it's current
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TABLE 1: users
-- Extends auth.users — one row per authenticated user.
-- Columns exactly as specified in Section 5.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'patient'
                CHECK (role IN ('patient', 'hospital_admin', 'super_admin')),
  hospital_id uuid,           -- FK to hospitals added after hospitals table is created
  phone       text NOT NULL DEFAULT ''
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- patients: can read their own row only
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- users can update their own row only
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- super_admin: full read
CREATE POLICY "users_select_superadmin"
  ON public.users FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- =============================================================================
-- TABLE 2: hospitals
-- Columns exactly as specified in Section 5.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.hospitals (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  address   text NOT NULL DEFAULT '',
  latitude  double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0
);

-- Now we can safely add the FK from users.hospital_id → hospitals.id
ALTER TABLE public.users
  ADD CONSTRAINT IF NOT EXISTS users_hospital_id_fkey
  FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL;

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Everyone (including unauthenticated via anon key) can read hospitals
CREATE POLICY "hospitals_select_public"
  ON public.hospitals FOR SELECT
  USING (true);

-- Only super_admin can insert/update hospitals
CREATE POLICY "hospitals_insert_superadmin"
  ON public.hospitals FOR INSERT
  WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "hospitals_update_superadmin"
  ON public.hospitals FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

-- =============================================================================
-- TABLE 3: doctors
-- Columns exactly as specified in Section 5.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id    uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  full_name      text NOT NULL,
  specialization text NOT NULL DEFAULT ''
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Everyone can read doctors (needed for patient booking flow)
CREATE POLICY "doctors_select_public"
  ON public.doctors FOR SELECT
  USING (true);

-- Only super_admin can insert/update doctors
CREATE POLICY "doctors_insert_superadmin"
  ON public.doctors FOR INSERT
  WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "doctors_update_superadmin"
  ON public.doctors FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

-- =============================================================================
-- TABLE 4: appointments
-- Columns exactly as specified in Section 5.
-- =============================================================================
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

-- patient: read/write ONLY their own appointments
CREATE POLICY "appointments_select_patient_own"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() = patient_id
    OR public.get_my_role() IN ('hospital_admin', 'super_admin')
  );

CREATE POLICY "appointments_insert_patient_own"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "appointments_update_patient_own"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- hospital_admin: read/update appointments scoped to their hospital_id only
CREATE POLICY "appointments_select_admin_own_hospital"
  ON public.appointments FOR SELECT
  USING (
    public.get_my_role() = 'hospital_admin'
    AND hospital_id = public.get_my_hospital_id()
  );

CREATE POLICY "appointments_update_admin_own_hospital"
  ON public.appointments FOR UPDATE
  USING (
    public.get_my_role() = 'hospital_admin'
    AND hospital_id = public.get_my_hospital_id()
  );

-- =============================================================================
-- TABLE 5: queue_state
-- One row per doctor per day. PK is (doctor_id, date) — doctor_id is also
-- listed as PK in Section 5; using a composite PK so multiple dates can exist.
-- Section 5 says: "doctor_id (FK, PK)" — we honour this by making doctor_id
-- the single PK as written, one row per doctor (today's state only).
-- For multi-day the booking logic will UPSERT by (doctor_id, date).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.queue_state (
  doctor_id         uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  date              date NOT NULL DEFAULT CURRENT_DATE,
  now_serving_token integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, date)
);

ALTER TABLE public.queue_state ENABLE ROW LEVEL SECURITY;

-- Patients can read queue_state to track their position (realtime subscription)
CREATE POLICY "queue_state_select_patient"
  ON public.queue_state FOR SELECT
  USING (
    public.get_my_role() IN ('patient', 'hospital_admin', 'super_admin')
    OR auth.uid() IS NOT NULL
  );

-- hospital_admin: can insert/update queue_state for their hospital's doctors only
CREATE POLICY "queue_state_insert_admin"
  ON public.queue_state FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'hospital_admin'
    AND (
      SELECT hospital_id FROM public.doctors WHERE id = doctor_id
    ) = public.get_my_hospital_id()
  );

CREATE POLICY "queue_state_update_admin"
  ON public.queue_state FOR UPDATE
  USING (
    public.get_my_role() = 'hospital_admin'
    AND (
      SELECT hospital_id FROM public.doctors WHERE id = doctor_id
    ) = public.get_my_hospital_id()
  );

-- =============================================================================
-- TABLE 6: beds
-- Columns exactly as specified in Section 5.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.beds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  ward_type       text NOT NULL
                    CHECK (ward_type IN ('ICU', 'General', 'Emergency')),
  total_beds      integer NOT NULL CHECK (total_beds >= 0),
  available_beds  integer NOT NULL CHECK (available_beds >= 0),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- Everyone can read beds (emergency bed finder is public-facing)
CREATE POLICY "beds_select_public"
  ON public.beds FOR SELECT
  USING (true);

-- hospital_admin: can update bed counts for their own hospital only
-- (INSERT is used at seed time via service-role key, which bypasses RLS)
CREATE POLICY "beds_update_admin_own_hospital"
  ON public.beds FOR UPDATE
  USING (
    public.get_my_role() = 'hospital_admin'
    AND hospital_id = public.get_my_hospital_id()
  );

-- =============================================================================
-- Enable Realtime on tables that need live push updates (Phase 5 onwards)
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
