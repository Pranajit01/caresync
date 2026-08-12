#!/usr/bin/env node
/**
 * CareSync — Phase 3 Database Setup (REST version)
 *
 * Applies supabase/schema.sql and supabase/seed.sql using the Supabase
 * Management API — requires only the keys already in .env.local.
 * No pg package, no psql, no DB password needed.
 *
 * Usage (from repo root):
 *   node scripts/apply-schema-rest.mjs
 *
 * Requirements:
 *   .env.local must contain:
 *     NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
 *     SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load .env.local
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
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // env vars may be set externally
  }
}
loadEnvLocal();

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "\n❌  Missing credentials in .env.local.\n" +
    "    Ensure these two are set:\n" +
    "      NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co\n" +
    "      SUPABASE_SERVICE_ROLE_KEY=eyJ...\n"
  );
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl
  .replace(/^https?:\/\//, "")
  .replace(/\.supabase\.co.*$/, "");

if (!projectRef || projectRef.includes("/") || projectRef.length < 10) {
  console.error(`❌  Could not parse project ref from URL: ${supabaseUrl}`);
  process.exit(1);
}

const MGMT_API = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

// ---------------------------------------------------------------------------
// Run SQL via Supabase Management API
// ---------------------------------------------------------------------------
async function runSql(label, sql) {
  console.log(`\n📄  ${label} …`);

  const res = await fetch(MGMT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => "(no body)");
  }

  if (!res.ok) {
    // Management API returns 200 for SQL errors too sometimes — check body
    const errMsg =
      body?.error ?? body?.message ?? JSON.stringify(body) ?? res.statusText;
    throw new Error(`HTTP ${res.status}: ${errMsg}`);
  }

  if (body?.error) {
    throw new Error(body.error);
  }

  console.log(`✅  ${label} applied.`);
  return body;
}

// ---------------------------------------------------------------------------
// Verification query
// ---------------------------------------------------------------------------
async function queryRows(table) {
  const res = await fetch(MGMT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: `SELECT COUNT(*) AS n FROM public.${table}` }),
  });
  const body = await res.json();
  return body?.[0]?.n ?? body?.rows?.[0]?.n ?? "?";
}

async function checkRls(table) {
  const res = await fetch(MGMT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      query: `SELECT relrowsecurity FROM pg_class WHERE relname = '${table}' AND relkind = 'r'`,
    }),
  });
  const body = await res.json();
  return body?.[0]?.relrowsecurity ?? body?.rows?.[0]?.relrowsecurity ?? false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const schemaPath = resolve(__dirname, "../supabase/schema.sql");
const seedPath   = resolve(__dirname, "../supabase/seed.sql");
const schemaSql  = readFileSync(schemaPath, "utf-8");
const seedSql    = readFileSync(seedPath, "utf-8");

console.log(`\n🔌  Project: ${projectRef}`);
console.log(`    Management API: ${MGMT_API}\n`);

try {
  await runSql("schema.sql", schemaSql);
  await runSql("seed.sql", seedSql);

  // Verification
  console.log("\n🔍  Verification — row counts:");
  const tables = ["hospitals", "doctors", "beds", "appointments", "queue_state", "users"];
  for (const t of tables) {
    const n = await queryRows(t);
    const icon = parseInt(n) > 0 || t === "appointments" || t === "queue_state" || t === "users" ? (parseInt(n) >= 0 ? "✅" : "⬜") : "⬜";
    console.log(`  ${icon}  public.${t}: ${n} rows`);
  }

  console.log("\n🔒  RLS check:");
  for (const t of tables) {
    const enabled = await checkRls(t);
    console.log(`  ${enabled ? "✅" : "❌"}  ${t}: RLS ${enabled ? "enabled" : "DISABLED"}`);
  }

  console.log("\n🎉  Phase 3 complete! Database schema + seed data applied.\n");
} catch (err) {
  console.error("\n❌  Failed:", err.message);

  // Helpful hints for common errors
  if (err.message.includes("403") || err.message.includes("Unauthorized")) {
    console.error(
      "\n    ℹ️  Check that SUPABASE_SERVICE_ROLE_KEY in .env.local is correct.\n" +
      "    The service role key starts with 'eyJ' and is found at:\n" +
      "    Supabase Dashboard → Settings → API → service_role (secret)\n"
    );
  }
  if (err.message.includes("already exists")) {
    console.error(
      "\n    ℹ️  Tables may already exist. This is fine — the schema uses\n" +
      "    'CREATE TABLE IF NOT EXISTS' so re-running is safe.\n"
    );
  }
  process.exit(1);
}
