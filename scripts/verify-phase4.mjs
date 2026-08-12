#!/usr/bin/env node
/**
 * CareSync — Phase 4 Verification Script
 * Tests Patient Booking Flow & Sequential Token Generation (Section 6)
 *
 * Run: node scripts/verify-phase4.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ignore */ }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function run() {
  console.log("\n🧪 CareSync Phase 4 Verification — Patient Booking & Token Engine\n");

  const pgModule = await import("pg");
  const Client = pgModule.default?.Client || pgModule.Client;

  const client = new Client({
    user: "postgres.ejxwayporwalikzpbhiq",
    password: process.env.SUPABASE_DB_PASSWORD || "pdas@caresync",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("✅ Connected to Supabase DB.");

  try {
    // 1. Fetch Apollo Multispecialty Hospital
    const hospRes = await client.query(
      "SELECT id, name FROM public.hospitals WHERE name LIKE '%Apollo%' LIMIT 1"
    );
    if (hospRes.rows.length === 0) {
      throw new Error("Apollo hospital not found in seed data!");
    }
    const hospital = hospRes.rows[0];
    console.log(`🏥 Hospital selected: ${hospital.name} (${hospital.id})`);

    // 2. Fetch Doctor at Apollo (Dr. Arindam Sen)
    const docRes = await client.query(
      "SELECT id, full_name, specialization FROM public.doctors WHERE hospital_id = $1 LIMIT 1",
      [hospital.id]
    );
    if (docRes.rows.length === 0) {
      throw new Error("No doctor found for selected hospital!");
    }
    const doctor = docRes.rows[0];
    console.log(`👨‍⚕️ Doctor selected: ${doctor.full_name} — ${doctor.specialization}`);

    // 3. Ensure a test patient exists in auth.users + public.users
    const testPatientId = "00000000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
      VALUES (
        '${testPatientId}',
        '00000000-0000-0000-0000-000000000000',
        'testpatient_phase4@caresync.internal',
        'nopassword',
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Test Patient Phase4","role":"patient"}',
        now(),
        now(),
        'authenticated',
        'authenticated'
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO public.users (id, full_name, role, phone)
      VALUES ('${testPatientId}', 'Test Patient Phase4', 'patient', '9876543210')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log(`👤 Test patient account verified: ${testPatientId}`);

    // 4. Test Booking #1 via book_appointment stored procedure
    const todayStr = new Date().toISOString().split("T")[0];
    console.log(`\n🎟️ Issuing Token #1 for date ${todayStr}...`);
    
    const book1Res = await client.query(
      "SELECT * FROM public.book_appointment($1, $2, $3, $4)",
      [testPatientId, doctor.id, hospital.id, todayStr]
    );
    
    const appt1 = book1Res.rows[0];
    console.log(`   ✅ Token Issued: #${appt1.token_number} (Appointment ID: ${appt1.appointment_id})`);

    // 5. Test Booking #2 for the same doctor and date
    console.log(`\n🎟️ Issuing Token #2 for same doctor & date...`);
    const book2Res = await client.query(
      "SELECT * FROM public.book_appointment($1, $2, $3, $4)",
      [testPatientId, doctor.id, hospital.id, todayStr]
    );
    
    const appt2 = book2Res.rows[0];
    console.log(`   ✅ Token Issued: #${appt2.token_number} (Appointment ID: ${appt2.appointment_id})`);

    // 6. Verify sequential order
    if (appt2.token_number !== appt1.token_number + 1) {
      throw new Error(`Token sequence failure: expected ${appt1.token_number + 1}, got ${appt2.token_number}`);
    }
    console.log(`\n🎯 Sequential token logic verified! (${appt1.token_number} -> ${appt2.token_number})`);

    // 7. Verify queue_state row initialized
    const qsRes = await client.query(
      "SELECT * FROM public.queue_state WHERE doctor_id = $1 AND date = $2",
      [doctor.id, todayStr]
    );
    if (qsRes.rows.length === 0) {
      throw new Error("queue_state was not automatically initialized!");
    }
    console.log(`\n📊 Queue state initialized for Doctor ${doctor.full_name}: now_serving_token = ${qsRes.rows[0].now_serving_token}`);

    console.log("\n🎉 Phase 4 VERIFICATION SUCCESSFUL! Patient booking flow & sequential token engine are ready.\n");
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error("\n❌ Verification failed:", e);
  process.exit(1);
});
