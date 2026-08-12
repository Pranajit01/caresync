-- =============================================================================
-- MOCK DEMO DATA. Not real hospital data. For hackathon/demo purposes only.
-- Real-time bed counts, live doctor rosters, and OPD queues are private
-- hospital data not publicly available. The hospital names and locations
-- below are real Kolkata institutions from public listings; all doctors,
-- bed numbers, and OPD schedules are invented for demonstration purposes.
-- Source: PROJECT_RULES.md Appendix A
-- =============================================================================

-- Run this AFTER schema.sql has been applied.
-- Safe to re-run: uses ON CONFLICT DO NOTHING on hospitals/doctors,
-- TRUNCATE + re-insert for beds so counts stay sensible.

-- =============================================================================
-- HOSPITALS (5 Kolkata hospitals, approximate real coordinates)
-- =============================================================================

INSERT INTO public.hospitals (id, name, address, latitude, longitude)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'Apollo Multispecialty Hospitals',
    '58 Canal Circular Rd, Kadapara, Phool Bagan, Kankurgachi, Kolkata 700054',
    22.5800,
    88.4200
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'AMRI Hospitals Mukundapur',
    'JC-16/17, Sector III, Salt Lake City, Kolkata 700098',
    22.5000,
    88.3900
  ),
  (
    'a3000000-0000-0000-0000-000000000003',
    'Fortis Hospital Anandapur',
    '730 Anandapur, E M Bypass, Kolkata 700107',
    22.5000,
    88.4000
  ),
  (
    'a4000000-0000-0000-0000-000000000004',
    'CMRI (Calcutta Medical Research Institute)',
    '7/2 Diamond Harbour Rd, Kolkata 700027',
    22.5300,
    88.3500
  ),
  (
    'a5000000-0000-0000-0000-000000000005',
    'Belle Vue Clinic',
    '9 Dr UN Brahmachari St, Minto Park, Kolkata 700017',
    22.5400,
    88.3500
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- MOCK DOCTORS (5–6 per hospital, following naming/specialization pattern
-- from Appendix A — names are invented, not real practicing physicians)
-- =============================================================================

INSERT INTO public.doctors (id, hospital_id, full_name, specialization)
VALUES
  -- Apollo Multispecialty (6 doctors)
  ('d1010000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Arindam Sen',         'Cardiology'),
  ('d1020000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Priya Mukherjee',     'General Medicine'),
  ('d1030000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Rajat Banerjee',      'Orthopedics'),
  ('d1040000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Soma Chakrabarti',    'Dermatology'),
  ('d1050000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Tapas Bose',          'Pulmonology'),
  ('d1060000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Nilufar Hossain',     'Endocrinology'),

  -- AMRI Mukundapur (6 doctors)
  ('d2010000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Dr. Sourav Chatterjee',   'Gynecology'),
  ('d2020000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Dr. Ananya Roy',          'Pediatrics'),
  ('d2030000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Dr. Partha Ghosh',        'Cardiology'),
  ('d2040000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Dr. Ruma Das',            'Neurology'),
  ('d2050000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Dr. Abhijit Pal',         'General Surgery'),
  ('d2060000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Dr. Sreeja Biswas',       'Ophthalmology'),

  -- Fortis Anandapur (5 doctors)
  ('d3010000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Dr. Debjani Ghosh',       'Neurology'),
  ('d3020000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Dr. Kunal Dasgupta',      'ENT'),
  ('d3030000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Dr. Mitali Sengupta',     'Orthopedics'),
  ('d3040000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Dr. Arnab Majumdar',      'Cardiology'),
  ('d3050000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Dr. Priyanka Dutta',      'General Medicine'),

  -- CMRI (5 doctors)
  ('d4010000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Dr. Subrata Mondal',      'General Surgery'),
  ('d4020000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Dr. Tanushree Nandi',     'Pediatrics'),
  ('d4030000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Dr. Bikash Saha',         'Urology'),
  ('d4040000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Dr. Chandana Mitra',      'Gynecology'),
  ('d4050000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Dr. Samir Kundu',         'Pulmonology'),

  -- Belle Vue Clinic (5 doctors)
  ('d5010000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 'Dr. Ritwik Sarkar',       'Dermatology'),
  ('d5020000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 'Dr. Mousumi Bhattacharya','Endocrinology'),
  ('d5030000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 'Dr. Sanjib Haldar',       'Cardiology'),
  ('d5040000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 'Dr. Rachna Agarwal',      'General Medicine'),
  ('d5050000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 'Dr. Prosenjit Das',       'Orthopedics')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- MOCK BED AVAILABILITY (3 ward types per hospital: General / ICU / Emergency)
-- Counts randomised within Appendix A ranges at seed time.
-- General:   total 80–150, available 10–40
-- ICU:       total 15–30,  available 1–8
-- Emergency: total 10–20,  available 2–10
-- =============================================================================

-- Truncate & re-insert beds so re-running stays idempotent
TRUNCATE TABLE public.beds RESTART IDENTITY CASCADE;

INSERT INTO public.beds (hospital_id, ward_type, total_beds, available_beds, updated_at)
VALUES
  -- Apollo Multispecialty
  ('a1000000-0000-0000-0000-000000000001', 'General',   140, 32, now()),
  ('a1000000-0000-0000-0000-000000000001', 'ICU',        28,  6, now()),
  ('a1000000-0000-0000-0000-000000000001', 'Emergency',  18,  7, now()),

  -- AMRI Mukundapur
  ('a2000000-0000-0000-0000-000000000002', 'General',   120, 25, now()),
  ('a2000000-0000-0000-0000-000000000002', 'ICU',        24,  4, now()),
  ('a2000000-0000-0000-0000-000000000002', 'Emergency',  15,  5, now()),

  -- Fortis Anandapur
  ('a3000000-0000-0000-0000-000000000003', 'General',   100, 18, now()),
  ('a3000000-0000-0000-0000-000000000003', 'ICU',        20,  3, now()),
  ('a3000000-0000-0000-0000-000000000003', 'Emergency',  14,  8, now()),

  -- CMRI
  ('a4000000-0000-0000-0000-000000000004', 'General',    90, 14, now()),
  ('a4000000-0000-0000-0000-000000000004', 'ICU',        18,  2, now()),
  ('a4000000-0000-0000-0000-000000000004', 'Emergency',  12,  4, now()),

  -- Belle Vue Clinic
  ('a5000000-0000-0000-0000-000000000005', 'General',    85, 21, now()),
  ('a5000000-0000-0000-0000-000000000005', 'ICU',        16,  5, now()),
  ('a5000000-0000-0000-0000-000000000005', 'Emergency',  10,  3, now());
