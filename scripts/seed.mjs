#!/usr/bin/env node
/**
 * Fills the database with a plausible six months of household spending so the
 * dashboard has something to draw. Safe by default: refuses to touch a database
 * that already has data unless you pass --force.
 *
 *   npm run seed
 *   npm run seed -- --force
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.FAMILY_DB_PATH ?? path.join(process.cwd(), "data", "family.db");
const force = process.argv.includes("--force");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, category TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
    spent_at TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

const existing = db.prepare("SELECT COUNT(*) AS n FROM members").get().n;
if (existing > 0 && !force) {
  console.log(`Database already has ${existing} member(s). Re-run with --force to replace the data.`);
  process.exit(0);
}
if (force) {
  db.exec("DELETE FROM expenses; DELETE FROM members;");
}

const MEMBERS = [
  { name: "Gokul", role: "Appa" },
  { name: "Meera", role: "Amma" },
  { name: "Arjun", role: "Son" },
  { name: "Diya", role: "Daughter" },
];

/** [category, weight, min₹, max₹, notes] — weights shape a believable mix. */
const PATTERN = [
  ["groceries", 26, 300, 3200, ["Weekly vegetables", "Rice and dals", "Milk and eggs", "Supermarket run"]],
  ["dining", 16, 180, 2400, ["Sunday lunch out", "Filter coffee", "Tiffin", "Birthday dinner"]],
  ["transport", 14, 60, 1800, ["Auto fare", "Petrol", "Metro card top-up", "Cab to station"]],
  ["utilities", 8, 400, 3500, ["Electricity bill", "Water can", "Gas cylinder", "Broadband"]],
  ["rent", 2, 18000, 22000, ["Monthly rent"]],
  ["health", 7, 200, 4500, ["Pharmacy", "Dentist", "Check-up", "Physio session"]],
  ["education", 6, 500, 9000, ["Tuition fee", "Notebooks", "School trip", "Exam fee"]],
  ["shopping", 8, 400, 5200, ["School shoes", "Kurta", "Bedsheets", "Rain jacket"]],
  ["entertainment", 6, 150, 2000, ["Movie tickets", "Streaming plan", "Board game"]],
  ["gifts", 3, 500, 4000, ["Wedding gift", "Birthday present"]],
  ["mobile", 4, 199, 999, ["Prepaid recharge", "Data pack"]],
];

const WEIGHTED = PATTERN.flatMap((entry) => Array.from({ length: entry[1] }, () => entry));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const id = (p) => `${p}_${Math.random().toString(36).slice(2, 12)}`;

const insertMember = db.prepare("INSERT INTO members (id, name, role, created_at) VALUES (?, ?, ?, ?)");
const insertExpense = db.prepare(
  "INSERT INTO expenses (id, member_id, amount, category, note, spent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
);

const now = new Date();
const memberIds = MEMBERS.map((m, i) => {
  const mid = id("mem");
  const created = new Date(now.getFullYear(), now.getMonth() - 6, 1 + i).toISOString();
  insertMember.run(mid, m.name, m.role, created);
  return mid;
});

// Adults log most of the spending; the kids log the occasional treat.
const spenderPool = [memberIds[0], memberIds[0], memberIds[1], memberIds[1], memberIds[1], memberIds[2], memberIds[3]];

let inserted = 0;
for (let back = 5; back >= 0; back--) {
  const cursor = new Date(now.getFullYear(), now.getMonth() - back, 1);
  const isCurrentMonth = back === 0;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const entries = Math.round((isCurrentMonth ? 30 : 42) * (0.85 + Math.random() * 0.3));

  for (let i = 0; i < entries; i++) {
    const [cat, , min, max, notes] = pick(WEIGHTED);
    const day = cat === "rent" ? Math.min(3, lastDay) : rand(1, lastDay);
    const spentAt = new Date(cursor.getFullYear(), cursor.getMonth(), day).toLocaleDateString("en-CA");
    insertExpense.run(
      id("exp"),
      cat === "rent" || cat === "utilities" ? memberIds[0] : pick(spenderPool),
      rand(min, max) * 100,
      cat,
      Math.random() < 0.75 ? pick(notes) : "",
      spentAt,
      new Date().toISOString(),
    );
    inserted++;
  }
}

db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
).run("monthly_budget", String(60000 * 100));

const total = db.prepare("SELECT SUM(amount) AS t FROM expenses").get().t ?? 0;
console.log(
  `Seeded ${MEMBERS.length} members and ${inserted} expenses (₹${(total / 100).toLocaleString("en-IN")}) into ${DB_PATH}`,
);
