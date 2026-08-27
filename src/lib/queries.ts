import { getDb, newId } from "./db";
import { monthOf, todayISO } from "./format";

export type Member = { id: string; name: string; role: string; created_at: string };

export type Expense = {
  id: string;
  member_id: string;
  member_name: string;
  amount: number;
  category: string;
  note: string;
  spent_at: string;
  created_at: string;
};

// node:sqlite hands back null-prototype objects, which React refuses to send to
// Client Components. Spreading them into plain objects fixes that at the source.
const rows = <T>(sql: string, ...params: (string | number)[]): T[] =>
  (getDb().prepare(sql).all(...params) as unknown[]).map((r) => ({ ...(r as object) }) as T);

const row = <T>(sql: string, ...params: (string | number)[]): T | undefined => {
  const result = getDb().prepare(sql).get(...params);
  return result ? ({ ...(result as object) } as T) : undefined;
};

/* ------------------------------- members -------------------------------- */

export function listMembers(): Member[] {
  return rows<Member>("SELECT * FROM members ORDER BY created_at ASC");
}

export function getMember(id: string): Member | undefined {
  return row<Member>("SELECT * FROM members WHERE id = ?", id);
}

export function createMember(name: string, role: string): Member {
  const member: Member = {
    id: newId("mem"),
    name: name.trim(),
    role: role.trim(),
    created_at: new Date().toISOString(),
  };
  getDb().prepare("INSERT INTO members (id, name, role, created_at) VALUES (?, ?, ?, ?)").run(
    member.id,
    member.name,
    member.role,
    member.created_at,
  );
  return member;
}

export function renameMember(id: string, name: string, role: string): void {
  getDb().prepare("UPDATE members SET name = ?, role = ? WHERE id = ?").run(name.trim(), role.trim(), id);
}

/** Removes the member and, by cascade, every expense they logged. */
export function deleteMember(id: string): void {
  getDb().prepare("DELETE FROM members WHERE id = ?").run(id);
}

/* ------------------------------- expenses ------------------------------- */

export function createExpense(input: {
  memberId: string;
  amount: number;
  category: string;
  note?: string;
  spentAt?: string;
}): string {
  const id = newId("exp");
  getDb().prepare(
    `INSERT INTO expenses (id, member_id, amount, category, note, spent_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.memberId,
    input.amount,
    input.category,
    input.note?.trim() ?? "",
    input.spentAt || todayISO(),
    new Date().toISOString(),
  );
  return id;
}

export function deleteExpense(id: string): void {
  getDb().prepare("DELETE FROM expenses WHERE id = ?").run(id);
}

const EXPENSE_SELECT = `
  SELECT e.*, m.name AS member_name
  FROM expenses e JOIN members m ON m.id = e.member_id`;

export function listExpenses(opts: { month?: string; memberId?: string; limit?: number } = {}): Expense[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.month) {
    where.push("e.spent_at LIKE ?");
    params.push(`${opts.month}-%`);
  }
  if (opts.memberId) {
    where.push("e.member_id = ?");
    params.push(opts.memberId);
  }
  const sql =
    EXPENSE_SELECT +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY e.spent_at DESC, e.created_at DESC" +
    (opts.limit ? ` LIMIT ${Number(opts.limit)}` : "");
  return rows<Expense>(sql, ...params);
}

/* ------------------------------ dashboard ------------------------------- */

export type Slice = { key: string; label: string; total: number; count: number };

export type Dashboard = {
  month: string;
  total: number;
  count: number;
  dailyAverage: number;
  previousTotal: number;
  changePct: number | null;
  allTimeTotal: number;
  byCategory: Slice[];
  byMember: Slice[];
  trend: { month: string; total: number }[];
  recent: Expense[];
};

function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return monthOf(new Date(y, m - 2, 1).toLocaleDateString("en-CA"));
}

/** Days elapsed in `month`, so a mid-month daily average is not diluted. */
function daysElapsed(month: string): number {
  const [y, m] = month.split("-").map(Number);
  const now = new Date();
  if (monthOf(todayISO()) === month) return now.getDate();
  return new Date(y, m, 0).getDate();
}

export function getDashboard(month: string, memberId?: string): Dashboard {
  const like = `${month}-%`;
  const memberClause = memberId ? " AND e.member_id = ?" : "";
  const p = (extra: (string | number)[] = []) => (memberId ? [...extra, memberId] : extra);

  const totals = row<{ total: number | null; count: number }>(
    `SELECT SUM(e.amount) AS total, COUNT(*) AS count FROM expenses e WHERE e.spent_at LIKE ?${memberClause}`,
    ...p([like]),
  );
  const total = totals?.total ?? 0;
  const count = totals?.count ?? 0;

  const prev = previousMonth(month);
  const previousTotal =
    row<{ total: number | null }>(
      `SELECT SUM(e.amount) AS total FROM expenses e WHERE e.spent_at LIKE ?${memberClause}`,
      ...p([`${prev}-%`]),
    )?.total ?? 0;

  const allTimeTotal =
    row<{ total: number | null }>(
      `SELECT SUM(e.amount) AS total FROM expenses e WHERE 1 = 1${memberClause}`,
      ...p(),
    )?.total ?? 0;

  const byCategory = rows<Slice>(
    `SELECT e.category AS key, e.category AS label, SUM(e.amount) AS total, COUNT(*) AS count
     FROM expenses e WHERE e.spent_at LIKE ?${memberClause}
     GROUP BY e.category ORDER BY total DESC`,
    ...p([like]),
  );

  const byMember = rows<Slice>(
    `SELECT m.id AS key, m.name AS label,
            COALESCE(SUM(e.amount), 0) AS total, COUNT(e.id) AS count
     FROM members m
     LEFT JOIN expenses e ON e.member_id = m.id AND e.spent_at LIKE ?
     GROUP BY m.id ORDER BY total DESC, m.created_at ASC`,
    like,
  );

  // Six months ending with `month`, zero-filled so the trend has no gaps.
  const [ty, tm] = month.split("-").map(Number);
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) months.push(monthOf(new Date(ty, tm - 1 - i, 1).toLocaleDateString("en-CA")));
  const trendRows = rows<{ month: string; total: number }>(
    `SELECT substr(e.spent_at, 1, 7) AS month, SUM(e.amount) AS total
     FROM expenses e WHERE substr(e.spent_at, 1, 7) >= ? AND substr(e.spent_at, 1, 7) <= ?${memberClause}
     GROUP BY month`,
    ...p([months[0], months[months.length - 1]]),
  );
  const trendMap = new Map(trendRows.map((r) => [r.month, r.total]));
  const trend = months.map((m) => ({ month: m, total: trendMap.get(m) ?? 0 }));

  return {
    month,
    total,
    count,
    dailyAverage: Math.round(total / Math.max(1, daysElapsed(month))),
    previousTotal,
    changePct: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
    allTimeTotal,
    byCategory,
    byMember,
    trend,
    recent: listExpenses({ month, memberId, limit: 8 }),
  };
}

/** Months that actually have data, newest first — used by the month switcher. */
export function listMonths(): string[] {
  const found = rows<{ month: string }>(
    "SELECT DISTINCT substr(spent_at, 1, 7) AS month FROM expenses ORDER BY month DESC",
  ).map((r) => r.month);
  const current = monthOf(todayISO());
  return found.includes(current) ? found : [current, ...found];
}

/* ------------------------------- settings ------------------------------- */

export function getSetting(key: string): string | undefined {
  return row<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)?.value;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(key, value);
}

export function getBudget(): number {
  const raw = getSetting("monthly_budget");
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Total spent on one calendar day, optionally by one member. */
export function getDayTotal(iso: string, memberId?: string): number {
  const sql = memberId
    ? "SELECT SUM(amount) AS total FROM expenses WHERE spent_at = ? AND member_id = ?"
    : "SELECT SUM(amount) AS total FROM expenses WHERE spent_at = ?";
  const params = memberId ? [iso, memberId] : [iso];
  return row<{ total: number | null }>(sql, ...params)?.total ?? 0;
}

/** Total spent in a month by one member — used for the "your share" tile. */
export function getMemberMonthTotal(month: string, memberId: string): number {
  return (
    row<{ total: number | null }>(
      "SELECT SUM(amount) AS total FROM expenses WHERE spent_at LIKE ? AND member_id = ?",
      `${month}-%`,
      memberId,
    )?.total ?? 0
  );
}

/** Lifetime entry count per member — what a deletion would actually remove. */
export function countExpensesByMember(): Map<string, number> {
  const counts = rows<{ member_id: string; n: number }>(
    "SELECT member_id, COUNT(*) AS n FROM expenses GROUP BY member_id",
  );
  return new Map(counts.map((c) => [c.member_id, c.n]));
}
