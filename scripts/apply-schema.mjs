#!/usr/bin/env node
/**
 * CareSync — Phase 3 Database Setup Script
 *
 * Applies supabase/schema.sql and supabase/seed.sql to your remote
 * Supabase project using the Postgres connection string.
 *
 * Requirements:
 *   • .env.local must contain NEXT_PUBLIC_SUPABASE_URL,
 *     NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
 *   • SUPABASE_DB_PASSWORD must be set (see Supabase Dashboard →
 *     Settings → Database → Database password)
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=yourpassword node scripts/apply-schema.mjs
 *
 * What it does:
 *   1. Reads NEXT_PUBLIC_SUPABASE_URL to derive your project ref
 *   2. Connects to Postgres via the Supabase Transaction Pooler
 *   3. Runs schema.sql then seed.sql in sequence
 *   4. Prints a verification summary (table row counts)
 */

import { readFileSync } from "fs";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 1. Load .env.local manually (no dotenv dependency needed)
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = resolve(__dirname, "../.env.local");
  try {
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local may not exist — env vars set externally are fine
  }
}
loadEnvLocal();

// ---------------------------------------------------------------------------
// 2. Validate required env vars
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

if (!dbPassword) {
  console.error(
    "\n❌  SUPABASE_DB_PASSWORD is not set.\n" +
    "    Run: SUPABASE_DB_PASSWORD=yourpassword node scripts/apply-schema.mjs\n" +
    "    Find your password at: Supabase Dashboard → Settings → Database → Database password"
  );
  process.exit(1);
}

// Derive project ref from URL (https://XXXXX.supabase.co → XXXXX)
const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
if (!projectRef || projectRef.includes("/")) {
  console.error(`❌  Could not parse project ref from URL: ${supabaseUrl}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Build connection string (Transaction Pooler on port 6543)
// ---------------------------------------------------------------------------
const connectionString =
  `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}` +
  `@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`;

// ---------------------------------------------------------------------------
// 4. Dynamically import 'pg' (already available in node_modules via supabase-js deps)
//    If not available, fall back to a helpful error message.
// ---------------------------------------------------------------------------
let Client;
try {
  const pgModule = await import("pg");
  Client = pgModule.default?.Client ?? pgModule.Client;
} catch {
  console.error(
    "❌  The 'pg' package is not installed.\n" +
    "    Run: npm install pg --save-dev\n" +
    "    Then retry."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 5. Read SQL files
// ---------------------------------------------------------------------------
const schemaPath = resolve(__dirname, "../supabase/schema.sql");
const seedPath   = resolve(__dirname, "../supabase/seed.sql");

let schemaSql, seedSql;
try {
  schemaSql = readFileSync(schemaPath, "utf-8");
  seedSql   = readFileSync(seedPath, "utf-8");
} catch (err) {
  console.error("❌  Could not read SQL files:", err.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 6. Apply schema + seed
// ---------------------------------------------------------------------------
const client = new Client({ connectionString });

async function run() {
  console.log(`\n🔌  Connecting to Supabase project: ${projectRef}`);
  await client.connect();
  console.log("✅  Connected.\n");

  try {
    console.log("📄  Applying schema.sql …");
    await client.query(schemaSql);
    console.log("✅  Schema applied.\n");

    console.log("🌱  Applying seed.sql …");
    await client.query(seedSql);
    console.log("✅  Seed data loaded.\n");

    // Verification queries
    console.log("🔍  Verification — table row counts:");
    const tables = [
      "hospitals",
      "doctors",
      "beds",
      "appointments",
      "queue_state",
      "users",
    ];
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM public.${table}`);
      const count = res.rows[0].count;
      const icon = parseInt(count) > 0 ? "✅" : "⬜";
      console.log(`  ${icon}  public.${table}: ${count} rows`);
    }

    // RLS check
    console.log("\n🔒  RLS enabled check:");
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname IN ('users','hospitals','doctors','appointments','queue_state','beds')
        AND relkind = 'r'
      ORDER BY relname
    `);
    for (const row of rlsRes.rows) {
      const icon = row.relrowsecurity ? "✅" : "❌";
      console.log(`  ${icon}  ${row.relname}: RLS ${row.relrowsecurity ? "enabled" : "DISABLED"}`);
    }

    console.log("\n🎉  Phase 3 complete. Database is ready for Phase 4.\n");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("\n❌  Error during setup:", err.message);
  client.end().catch(() => {});
  process.exit(1);
});
