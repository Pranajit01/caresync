CareSync — Master Build Document (Vibe Coding Kit)
A Real-Time Platform for Smart OPD Management and Emergency Healthcare Coordination Prepared for: Google Antigravity build


________________


0. HOW TO USE THIS DOCUMENT (READ THIS FIRST)
You are building from zero. Follow this exact sequence — do not skip steps.


1. Do not paste this whole file and say "build the app." Antigravity (like all AI coding agents) hallucinates more when given a huge scope in one shot.
2. Paste this entire file into Antigravity as a project rules / context file first (create a file called PROJECT_RULES.md in your repo root and paste this in). This gives it permanent memory of the spec.
3. Then work phase by phase using Section 9 (Implementation Plan). After every phase:
   * Run the app.
   * Check it against the "Definition of Done" for that phase.
   * Only then say: "Phase X is verified working. Proceed to Phase X+1."
4. If Antigravity ever suggests a library, table, route, or feature not listed in this document, reject it and reply: "Not in PROJECT_RULES.md — stick to the spec." This single habit prevents 90% of hallucination drift.
5. Two interfaces exist in this app — never let them merge. Patient/User app and Admin/Hospital dashboard are separate route groups, separate login roles, separate UI.


________________


1. PRD — PRODUCT REQUIREMENTS DOCUMENT
App Name
CareSync
Tagline
Connected Care. Better Health.
Problem Statement
OPDs suffer from overcrowding and unpredictable wait times because token systems don't reflect real doctor pace. In emergencies, patients waste critical time because they don't know which hospital has an open bed.
Target Users
Role
	Who they are
	What they need
	Patient (User)
	General public visiting hospitals
	Book OPD slot, track live queue, find emergency beds
	Hospital Staff (Admin)
	Reception/OPD desk at a single hospital
	Manage doctor queue, update bed status
	Super Admin
	Platform owner (you, for the MVP demo)
	Onboard hospitals, view cross-hospital analytics
	Core Features — MVP Scope
Patient App


* Sign up / log in (email + OTP or email+password for MVP)
* Browse hospitals → doctors → book OPD appointment
* Receive digital token number
* Live queue tracker (see current token being served vs. your token)
* Push/in-app notification when your turn is near
* Emergency bed finder: list of nearby hospitals with live bed count


Admin App (per-hospital)


* Login (role: hospital_admin)
* Doctor check-in / mark consultation started / completed (this drives the queue engine)
* View today's OPD queue for their hospital
* Update emergency bed counts (available / occupied) per department (ICU, General, Emergency)
* Basic analytics: patients served today, average wait time


Super Admin (optional, only if time allows)


* Add/remove hospitals
* View cross-hospital bed availability map
Nice-to-Have (do NOT build in MVP — flag if Antigravity tries)
* Payment integration
* Native mobile app (web app / PWA is enough)
* HIS/EMR integration (HL7 FHIR) — mention only, don't implement
* AI-based diagnosis or triage
* Multi-language support
User Stories
* As a patient, I want to book a doctor's OPD slot online so I don't have to stand in line to get a token.
* As a patient, I want to see my live queue position so I know when to arrive.
* As a patient in an emergency, I want to see which nearby hospital has a free bed right now.
* As hospital staff, I want to mark a patient's consultation as done so the queue auto-advances.
* As hospital staff, I want to update bed availability in one tap so the network stays accurate.
Success Metrics (for your demo/pitch, not real production KPIs)
* Booking-to-token time under 30 seconds
* Queue position updates within 5 seconds of doctor action
* Bed status reflects hospital admin's last update with no conflicting reads
Explicitly OUT OF SCOPE for v1
No payments. No native mobile app. No real HIS/EMR integration. No AI diagnosis. No multi-hospital chain login (each hospital admin only sees their own hospital). State this to Antigravity directly if it starts adding these.


________________


2. TRD — TECHNICAL REQUIREMENTS DOCUMENT
Stack (chosen for $0 cost — fits your budget)
Layer
	Technology
	Why
	Frontend
	Next.js 14 (App Router) + TypeScript
	Free, Vercel-native, huge AI training data = fewer hallucinations
	Styling
	Tailwind CSS
	Fast, consistent UI, matches UI/UX brief below
	Backend/API
	Next.js Route Handlers (no separate backend server needed)
	Keeps it a single repo, simpler for solo build
	Database + Auth
	Supabase (free tier)
	Postgres + built-in Auth + Realtime subscriptions (perfect for live queue)
	Realtime queue updates
	Supabase Realtime (Postgres change subscriptions)
	Free, no extra service needed
	Notifications (MVP)
	In-app + browser push (free) — SMS/WhatsApp is a "future" line item only
	Twilio/WhatsApp Business API cost money; skip for MVP demo
	Maps (bed finder)
	Leaflet.js + OpenStreetMap
	Free, no API key/billing needed (unlike Google Maps)
	Hosting
	Vercel (frontend+API) + Supabase Cloud (DB)
	Both have generous free tiers
	Architecture (text diagram)
Patient Browser / Admin Browser


        ↓


Next.js Frontend (Vercel)


        ↓


Next.js API Routes (same repo)


        ↓


Supabase (Postgres DB + Auth + Realtime)


        ↓


Realtime updates pushed back to


Patient Queue Screen & Admin Dashboard
Environment Variables (create .env.local, never commit it)
NEXT_PUBLIC_SUPABASE_URL=


NEXT_PUBLIC_SUPABASE_ANON_KEY=


SUPABASE_SERVICE_ROLE_KEY=   (server-side only, never exposed to frontend)
Anti-Hallucination Constraints (paste these as-is into Antigravity)
* Use only Next.js 14 App Router, TypeScript, Tailwind, Supabase JS client. Do not introduce Redux, GraphQL, Firebase, MongoDB, Express, or any other backend framework.
* Do not invent API routes that aren't listed in Section 3/5. If a new route is genuinely needed, propose it and wait for approval.
* Do not invent database columns not listed in Section 6. Schema is fixed.
* All auth must go through Supabase Auth — no custom JWT systems.
* Every feature must map to a numbered item in Section 1 (PRD). If it doesn't, don't build it.


________________


3. APP FLOW — USER NAVIGATION
Patient (User) App Flow
Landing Page


   ↓


Sign Up / Login (role: patient)


   ↓


Home → [Book Appointment] or [Find Emergency Bed]


Book Appointment:


Select Hospital → Select Doctor → Select Time Slot → Confirm


   ↓


Digital Token Screen (token number + hospital + doctor)


   ↓


Live Queue Screen (your token vs. "now serving" token, auto-updates)


   ↓


Notification when 2 tokens away


   ↓


Consultation (marked done by admin — patient sees "Completed")


Find Emergency Bed:


Map/List of hospitals → live bed count per hospital → tap for directions
Admin (Hospital Staff) App Flow
Login (role: hospital_admin, scoped to their hospital_id)


   ↓


Admin Dashboard (today's overview)


   ↓


Queue Management Tab:


   See list of booked tokens for today → [Start Consultation] → [Mark Complete]


   (marking complete auto-advances "now serving" number → triggers realtime push to patients)


   ↓


Bed Management Tab:


   Update available/occupied count per ward (ICU / General / Emergency)


   ↓


Analytics Tab (read-only):


   Patients served today, average wait time
Screens Table
Screen
	Interface
	Purpose
	Landing
	Patient
	Explain product, login/signup CTA
	Login/Signup
	Both
	Auth, role-based redirect
	Book Appointment
	Patient
	Hospital → Doctor → Slot selection
	My Token
	Patient
	Show token + live queue position
	Emergency Finder
	Patient
	Map/list of hospitals with bed counts
	Admin Dashboard
	Admin
	Today's snapshot
	Queue Manager
	Admin
	Advance/manage today's queue
	Bed Manager
	Admin
	Update bed counts
	Analytics
	Admin
	Read-only stats
	

________________


4. UI/UX DESIGN BRIEF
Matches your poster branding (red + white, medical-trust aesthetic).
Priority Order (non-negotiable — tell Antigravity this explicitly)
1. Usability first. Every screen must be understandable in under 3 seconds, with zero confusion about what to tap next. This beats every other visual consideration.
2. Performance second. Zero perceptible lag. No janky scroll, no layout shift, no animation that blocks interaction. If an animation ever competes with speed, cut the animation.
3. Style third. Modern and polished, but restrained — see "Anti-AI-Slop Rules" below.


Element
	Choice
	Style
	Minimal, clean, trustworthy medical UI — calm, not decorative
	Primary color
	Red #E63946, used sparingly (CTAs, live status) — not flooding every element
	Secondary/background
	White #FFFFFF, light grey #F5F5F5
	Accent (success/live)
	Green #2A9D8F for "now serving" indicators
	Font
	Inter (Google Fonts, free) — one typeface, 2–3 weights max
	Corner radius
	Rounded (rounded-xl in Tailwind) — soft, approachable, consistent everywhere
	Icons
	Lucide icons (free, already available in this environment)
	Dark mode
	Not required for MVP — skip it, don't let Antigravity add unrequested complexity
	Shadows/gradients
	Subtle only (soft shadow-sm/shadow-md). No heavy glassmorphism, no neon gradients, no glowing borders
	The "Trust" Motion — Background Animation
On the landing/login page only (never inside the live queue or admin screens — those need to feel instant, not decorative):


* A subtle looping animation of two hands gently coming together (representing care/trust), rendered as a lightweight looping SVG or CSS animation — not a video file, not a heavy Lottie/GSAP library, to keep load time near-zero.
* Keep it soft-focus, low-opacity, and positioned as a background/hero element — it supports the message, it never distracts from the login button or CTA in front of it.
* Duration: slow, 4–6 second loop, subtle easing (no bounce, no sudden motion).
* Must not run on the queue tracker, booking flow, or admin dashboard — those screens prioritize speed and clarity over decoration.
Anti-"AI-Slop" Design Rules (tell Antigravity this directly)
A lot of AI-generated UIs share a recognizable look: oversized rounded gradients everywhere, purple/blue-violet color schemes, giant bold hero text, glowing card borders, excessive emoji, and animations on every single element. Avoid all of that. Instead:


* Restrained color usage — mostly white/grey with red as an accent, not a wash.
* Real information density where it matters (queue numbers, bed counts) — don't hide data behind extra clicks for the sake of "minimalism."
* No emoji in the production UI.
* No default shadcn/Tailwind template look copy-pasted without adjustment — tweak spacing, sizing, and hierarchy so it feels custom, like a senior product designer sat down and made deliberate choices for a medical, trust-first product (think: the calm confidence of a hospital's own branding, not a startup landing page).
* Motion should be purposeful, not decorative: queue numbers update with a quick, subtle transition (not a big flashy animation); buttons get a small, fast hover/press state; that's it.
Performance Rules (strict — hold Antigravity to these)
* Realtime queue/bed updates must feel instant (Supabase Realtime push, not polling).
* Images/icons must be optimized (Next.js <Image>, SVG icons — no large unoptimized PNGs).
* No animation library that adds meaningful bundle size for a one-off effect — prefer native CSS animations/transitions wherever possible.
* Test on a throttled/slow connection before calling any phase "done" — it must still feel smooth.
Key Components to Build
* Token Card (large token number, hospital/doctor name, status badge)
* Live Queue Bar (progress-style: "Now Serving: 06 → Your Token: 09") — instant, no animation lag
* Hospital Bed Card (hospital name, ICU/General/Emergency counts, distance)
* Admin Queue Row (patient name/token, Start / Complete buttons)
* Admin Bed Update Form (simple +/- counters per ward)
* Landing Hero (trust animation background + login/signup CTA)


________________


5. BACKEND SCHEMA
Tables (Supabase Postgres)
users (extends Supabase auth.users) | Column | Type | Notes | |---|---|---| | id | uuid (PK) | = auth.users.id | | full_name | text | | | role | text | 'patient' | 'hospital_admin' | 'super_admin' | | hospital_id | uuid (FK, nullable) | only set for hospital_admin | | phone | text | |


hospitals | Column | Type | Notes | |---|---|---| | id | uuid (PK) | | | name | text | | | address | text | | | latitude | float | | | longitude | float | |


doctors | Column | Type | Notes | |---|---|---| | id | uuid (PK) | | | hospital_id | uuid (FK) | | | full_name | text | | | specialization | text | |


appointments | Column | Type | Notes | |---|---|---| | id | uuid (PK) | | | patient_id | uuid (FK → users) | | | doctor_id | uuid (FK → doctors) | | | hospital_id | uuid (FK) | | | token_number | int | sequential per doctor per day | | status | text | 'booked' | 'in_progress' | 'completed' | 'cancelled' | | created_at | timestamp | |


queue_state | Column | Type | Notes | |---|---|---| | doctor_id | uuid (FK, PK) | one row per doctor per day | | date | date | | | now_serving_token | int | updated by admin actions |


beds | Column | Type | Notes | |---|---|---| | id | uuid (PK) | | | hospital_id | uuid (FK) | | | ward_type | text | 'ICU' | 'General' | 'Emergency' | | total_beds | int | | | available_beds | int | | | updated_at | timestamp | |
Auth Roles & Access Rules (Supabase Row-Level Security)
* patient: can read hospitals/doctors/beds (public), can only read/write their own rows in appointments.
* hospital_admin: can read/write appointments, queue_state, beds only where hospital_id = their own hospital_id.
* super_admin: full read access (write only to hospitals, doctors).


Tell Antigravity explicitly: "Enable Row Level Security on every table and write policies matching the rules above before writing any frontend code that touches these tables."


________________


6. QUEUE ENGINE LOGIC (custom logic — critical, don't let AI improvise this)
* When patient books → insert into appointments with next token_number for that doctor+date (use a Postgres sequence or count(*)+1, wrapped in a transaction to avoid duplicate tokens).
* When admin clicks "Start Consultation" on a token → update appointments.status='in_progress', update queue_state.now_serving_token.
* When admin clicks "Mark Complete" → update appointments.status='completed'.
* Patient's queue screen subscribes to queue_state via Supabase Realtime — no polling needed.
* Estimated wait = (patient's token_number - now_serving_token) * average_consultation_time. For MVP, hardcode average_consultation_time = 10 minutes; note in code comments that this should later come from historical data.
7. EMERGENCY BED CONFLICT LOGIC
* Bed updates always happen via a single UPDATE beds SET available_beds = available_beds - 1 WHERE id = ? AND available_beds > 0 (atomic, prevents going negative even with concurrent admins).
* Never let the frontend send an absolute number for "available_beds" — only send +1/-1 deltas through an API route that does the atomic update server-side.


________________


8. IMPLEMENTATION PLAN — BUILD PHASE BY PHASE
Work through these in order. Do not let Antigravity jump ahead.


Phase
	Goal
	Definition of Done
	1. Setup
	Next.js + TypeScript + Tailwind project, Supabase project created, env vars connected
	App runs locally, connects to Supabase, no errors
	2. Auth
	Signup/login with role field (patient vs hospital_admin)
	Can create both a patient and an admin test account, get redirected to correct dashboard
	3. Database & RLS
	Create all 6 tables from Section 5, enable RLS policies, then seed with Appendix A demo data
	Can insert/query each table respecting role rules; the 5 Kolkata hospitals, their doctors, and bed rows from Appendix A are visible in Supabase Table Editor
	4. Patient booking + token
	Hospital/doctor selection → booking → token generation, using seeded hospitals/doctors
	Booking a slot against a seeded doctor creates a correct sequential token in appointments
	5. Live queue engine
	Admin start/complete actions update queue_state; patient screen realtime-updates
	Opening two browser tabs (admin + patient) shows the patient's queue number update within 5 seconds of an admin action
	6. Admin dashboard
	Queue manager + bed manager + basic analytics UI
	Admin can see today's queue, advance it, and update bed counts
	7. Emergency bed finder
	Patient-facing map/list of hospitals with live bed counts
	Bed count changes from admin dashboard reflect on patient's finder screen
	8. UI polish
	Apply Section 4 design system across all screens
	Consistent colors/fonts/spacing, no default unstyled components
	9. Testing
	Manual test all user stories from Section 1
	Every user story in Section 1 works end-to-end
	10. Deploy
	Push to Vercel, connect production Supabase
	Live public URL works for both patient and admin flows
	

Rule for every phase: after Antigravity finishes a phase, test it yourself before saying "next phase." If something's broken, fix that phase fully before moving on — never let incomplete phases stack up.


________________


APPENDIX A — SEED DATA: TOP 5 KOLKATA HOSPITALS (DEMO DATA)
Important honesty note: Real-time bed counts, live doctor rosters, and OPD queues are private hospital data — not publicly available, and I'm not going to fabricate the appearance of live data pulled from a real source. What's below uses real, verifiable hospital names/locations from public listings, with invented (mock) doctors, bed numbers, and OPD timings for demo purposes only. This is exactly what you want for a hackathon/college demo: realistic-looking seed data, clearly mock, that makes the app feel alive without pretending to show real patient/hospital data. Load this via a Supabase SQL seed script in Phase 3.
Hospitals
Hospital
	Area
	Real info
	Mock demo data to seed
	Apollo Multispecialty Hospitals
	Kolkata (Salt Lake area)
	Large multi-specialty, ~750 beds, 200+ doctors, established 2003
	Seed: 6 mock doctors, 3 ward types
	AMRI Hospitals — Mukundapur
	Mukundapur, E.M. Bypass
	NABH-accredited, multiple Kolkata locations
	Seed: 6 mock doctors, 3 ward types
	Fortis Hospital, Anandapur
	Anandapur
	Part of Fortis Healthcare network, 24x7 emergency
	Seed: 5 mock doctors, 3 ward types
	CMRI (Calcutta Medical Research Institute)
	Kolkata
	Well-established multispecialty hospital
	Seed: 5 mock doctors, 3 ward types
	Belle Vue Clinic
	Minto Park
	Established 1967, ~304 beds
	Seed: 5 mock doctors, 3 ward types
	Mock Doctors (sample — repeat pattern per hospital, vary specialization)
Hospital
	Doctor (mock)
	Specialization
	Apollo Multispecialty
	Dr. Arindam Sen
	Cardiology
	Apollo Multispecialty
	Dr. Priya Mukherjee
	General Medicine
	Apollo Multispecialty
	Dr. Rajat Banerjee
	Orthopedics
	AMRI Mukundapur
	Dr. Sourav Chatterjee
	Gynecology
	AMRI Mukundapur
	Dr. Ananya Roy
	Pediatrics
	Fortis Anandapur
	Dr. Debjani Ghosh
	Neurology
	Fortis Anandapur
	Dr. Kunal Dasgupta
	ENT
	CMRI
	Dr. Subrata Mondal
	General Surgery
	Belle Vue Clinic
	Dr. Ritwik Sarkar
	Dermatology
	

(Antigravity: generate 5–6 mock doctors per hospital following this naming/specialization pattern — do not invent real doctor names or claim these are actual practicing physicians.)
Mock Bed Availability (per hospital, 3 ward types — randomize sensible numbers at seed time)
Ward Type
	Typical total beds (mock)
	Typical available (mock, randomize)
	General
	80–150
	10–40
	ICU
	15–30
	1–8
	Emergency
	10–20
	2–10
	Mock OPD Timings (for display only, not enforced in v1 logic)
* All 5 hospitals: OPD hours 9:00 AM – 5:00 PM, Mon–Sat.
* Emergency department: 24x7 for all 5 (this matches how these hospitals actually operate).
Seeding Instructions for Antigravity
Write a single SQL seed script (seed.sql) that:


1. Inserts the 5 hospitals above into the `hospitals` table with realistic Kolkata lat/long


   (approximate coordinates are fine — Apollo/Salt Lake ~22.58,88.42; AMRI Mukundapur ~22.50,88.39;


   Fortis Anandapur ~22.50,88.40; CMRI ~22.53,88.35; Belle Vue Minto Park ~22.54,88.35).


2. Inserts 5-6 mock doctors per hospital into `doctors`, following the specialization pattern above.


3. Inserts 3 bed rows per hospital (General/ICU/Emergency) into `beds` with randomized available_beds


   within the ranges above.


4. Clearly comment the file: "-- MOCK DEMO DATA. Not real hospital data. For hackathon/demo purposes only."


Run this seed script once after Phase 3 tables are created, before starting Phase 4.


________________


9. MASTER ANTI-HALLUCINATION RULES (paste this block as your Antigravity system/rules file)
You are building CareSync exactly as specified in this document. Follow these rules strictly:


1. Stack is fixed: Next.js 14 (App Router) + TypeScript + Tailwind + Supabase. Never substitute or add other frameworks/databases without explicit approval.


2. Two separate interfaces exist: Patient app and Admin app. Never merge their routes, layouts, or logic.


3. Database schema (Section 5) is final. Do not add, rename, or remove columns/tables without approval.


4. Only build features listed in Section 1 PRD "Core Features". Ignore anything under "Out of Scope."


5. Work one Implementation Plan phase (Section 8) at a time. Stop and wait for confirmation after each phase — do not pre-build future phases.


6. Bed count updates must always be atomic server-side deltas (Section 7) — never trust client-sent absolute numbers.


7. Enable Row Level Security per Section 5 before writing frontend data-fetching code.


8. If unsure about any requirement, ask instead of guessing or inventing a feature.


________________


Quick Start Checklist for You (do this before opening Antigravity)
1. Create a free Supabase account → new project → copy URL + anon key.
2. Create a free Vercel account (for later deployment).
3. Create a new empty GitHub repo for CareSync.
4. Create PROJECT_RULES.md in that repo, paste this entire document into it.
5. Open the repo in Google Antigravity, point it at PROJECT_RULES.md, and start with Phase 1 only.