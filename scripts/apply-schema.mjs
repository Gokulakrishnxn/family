#!/usr/bin/env node
/**
 * Applies every file in supabase/migrations, in filename order, over a direct
 * Postgres connection.
 *
 * Reads SUPABASE_DB_URL from the environment or from .env.local, so the
 * password stays in your own gitignored file and never appears on a command
 * line or in shell history.
 *
 *   npm run db:push
 *
 * The migrations are written to be safe to re-run.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const ROOT = process.cwd();
const MIGRATIONS = path.join(ROOT, "supabase", "migrations");

function readEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const connectionString = process.env.SUPABASE_DB_URL || readEnvLocal().SUPABASE_DB_URL;

if (!connectionString) {
  console.error(
    [
      "SUPABASE_DB_URL is not set.",
      "",
      "Add this line to .env.local (Supabase → Project Settings → Database →",
      "Connection string → URI, with your database password filled in):",
      "",
      "  SUPABASE_DB_URL=postgresql://postgres:YOUR-PASSWORD@db.<project-ref>.supabase.co:5432/postgres",
      "",
      "Prefer not to? Paste the SQL in supabase/migrations/ into the dashboard's",
      "SQL Editor instead — it does exactly the same thing.",
    ].join("\n"),
  );
  process.exit(1);
}

if (connectionString.includes("[YOUR-PASSWORD]")) {
  console.error("SUPABASE_DB_URL still has the [YOUR-PASSWORD] placeholder in it.");
  process.exit(1);
}

const files = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
if (files.length === 0) {
  console.error(`No .sql files found in ${MIGRATIONS}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const file of files) {
    process.stdout.write(`applying ${file} … `);
    await client.query(fs.readFileSync(path.join(MIGRATIONS, file), "utf8"));
    console.log("ok");
  }

  const { rows } = await client.query(
    `select table_name, (xpath('/row/c/text()',
        query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::int as rows
     from information_schema.tables
     where table_schema = 'public' and table_name in ('members','expenses','settings')
     order by table_name`,
  );
  console.log("\nSchema is live:");
  for (const r of rows) console.log(`  ${r.table_name.padEnd(9)} ${r.rows} row(s)`);
} catch (error) {
  console.error(`\nFailed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
