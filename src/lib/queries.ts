import { supabase } from "./supabase";
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

type ExpenseRow = Omit<Expense, "member_name"> & { members: { name: string } | null };

const EXPENSE_COLUMNS = "id, member_id, amount, category, note, spent_at, created_at, members(name)";

/** PostgREST caps a single response, so anything unbounded is read in pages. */
const PAGE_SIZE = 1000;

function toExpense(row: ExpenseRow): Expense {
  const { members, ...rest } = row;
  return { ...rest, member_name: members?.name ?? "Unknown" };
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

/* ------------------------------- members -------------------------------- */

export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase()
    .from("members")
    .select("id, name, role, created_at")
    .order("created_at", { ascending: true });
  fail("Could not load family members", error);
  return (data ?? []) as Member[];
}

export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await supabase()
    .from("members")
    .select("id, name, role, created_at")
    .eq("id", id)
    .maybeSingle();
  fail("Could not load that family member", error);
  return (data as Member | null) ?? null;
}

export async function createMember(name: string, role: string): Promise<Member> {
  const { data, error } = await supabase()
    .from("members")
    .insert({ name: name.trim(), role: role.trim() })
    .select("id, name, role, created_at")
    .single();
  fail("Could not add that family member", error);
  return data as Member;
}

export async function renameMember(id: string, name: string, role: string): Promise<void> {
  const { error } = await supabase()
    .from("members")
    .update({ name: name.trim(), role: role.trim() })
    .eq("id", id);
  fail("Could not update that family member", error);
}

/** Removes the member and, by cascade, every expense they logged. */
export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase().from("members").delete().eq("id", id);
  fail("Could not remove that family member", error);
}

/** Lifetime entry count per member — what a deletion would actually remove. */
export async function countExpensesByMember(memberIds: string[]): Promise<Map<string, number>> {
  const counts = await Promise.all(
    memberIds.map(async (id) => {
      const { count, error } = await supabase()
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("member_id", id);
      fail("Could not count expenses", error);
      return [id, count ?? 0] as const;
    }),
  );
  return new Map(counts);
}

/* ------------------------------- expenses ------------------------------- */

export async function createExpense(input: {
  memberId: string;
  amount: number;
  category: string;
  note?: string;
  spentAt?: string;
}): Promise<void> {
  const { error } = await supabase().from("expenses").insert({
    member_id: input.memberId,
    amount: input.amount,
    category: input.category,
    note: input.note?.trim() ?? "",
    spent_at: input.spentAt || todayISO(),
  });
  fail("Could not save that expense", error);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase().from("expenses").delete().eq("id", id);
  fail("Could not delete that expense", error);
}

export async function listExpenses(
  opts: { month?: string; memberId?: string; limit?: number } = {},
): Promise<Expense[]> {
  const rows = await readExpenses({
    from: opts.month ? `${opts.month}-01` : undefined,
    to: opts.month ? endOfMonth(opts.month) : undefined,
    memberId: opts.memberId,
    limit: opts.limit,
  });
  return rows.map(toExpense);
}

async function readExpenses(opts: {
  from?: string;
  to?: string;
  memberId?: string;
  limit?: number;
}): Promise<ExpenseRow[]> {
  const collected: ExpenseRow[] = [];
  const target = opts.limit ?? Number.POSITIVE_INFINITY;

  for (let offset = 0; collected.length < target; offset += PAGE_SIZE) {
    const size = Math.min(PAGE_SIZE, target - collected.length);
    let query = supabase()
      .from("expenses")
      .select(EXPENSE_COLUMNS)
      .order("spent_at", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + size - 1);

    if (opts.from) query = query.gte("spent_at", opts.from);
    if (opts.to) query = query.lte("spent_at", opts.to);
    if (opts.memberId) query = query.eq("member_id", opts.memberId);

    const { data, error } = await query;
    fail("Could not load expenses", error);

    const page = (data ?? []) as unknown as ExpenseRow[];
    collected.push(...page);
    if (page.length < size) break;
  }

  return collected;
}

/* ------------------------------ dashboard ------------------------------- */

export type Slice = { key: string; label: string; total: number; count: number };

export type Dashboard = {
  month: string;
  total: number;
  count: number;
  todayTotal: number;
  dailyAverage: number;
  previousTotal: number;
  changePct: number | null;
  hasAnyExpenses: boolean;
  byCategory: Slice[];
  byMember: Slice[];
  trend: { month: string; total: number }[];
  recent: Expense[];
};

function endOfMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).toLocaleDateString("en-CA");
}

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  return monthOf(new Date(y, m - 1 + by, 1).toLocaleDateString("en-CA"));
}

/** Days elapsed in `month`, so a mid-month daily average is not diluted. */
function daysElapsed(month: string): number {
  const [y, m] = month.split("-").map(Number);
  if (monthOf(todayISO()) === month) return new Date().getDate();
  return new Date(y, m, 0).getDate();
}

export async function getDashboard(month: string, memberId?: string): Promise<Dashboard> {
  // Six months ending with `month`, read in one pass and aggregated here — a
  // household's ledger is small, and this keeps the round trips down.
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
  const previous = shiftMonth(month, -1);

  const [windowRows, members, hasAnyExpenses] = await Promise.all([
    readExpenses({ from: `${months[0]}-01`, to: endOfMonth(month) }),
    listMembers(),
    anyExpensesExist(),
  ]);

  const inScope = (row: ExpenseRow) => !memberId || row.member_id === memberId;
  const monthRows = windowRows.filter((r) => monthOf(r.spent_at) === month && inScope(r));

  const total = sum(monthRows);
  const previousTotal = sum(windowRows.filter((r) => monthOf(r.spent_at) === previous && inScope(r)));
  const today = todayISO();

  const byCategory = groupBy(monthRows, (r) => r.category, (r) => r.category)
    .sort((a, b) => b.total - a.total);

  const memberTotals = new Map(
    groupBy(
      windowRows.filter((r) => monthOf(r.spent_at) === month),
      (r) => r.member_id,
      (r) => r.members?.name ?? "Unknown",
    ).map((slice) => [slice.key, slice]),
  );

  // Every member appears, including the ones who spent nothing this month.
  const byMember: Slice[] = members
    .map((m) => memberTotals.get(m.id) ?? { key: m.id, label: m.name, total: 0, count: 0 })
    .sort((a, b) => b.total - a.total);

  const trend = months.map((m) => ({
    month: m,
    total: sum(windowRows.filter((r) => monthOf(r.spent_at) === m && inScope(r))),
  }));

  return {
    month,
    total,
    count: monthRows.length,
    todayTotal: sum(windowRows.filter((r) => r.spent_at === today && inScope(r))),
    dailyAverage: Math.round(total / Math.max(1, daysElapsed(month))),
    previousTotal,
    changePct: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
    hasAnyExpenses,
    byCategory,
    byMember,
    trend,
    recent: monthRows.slice(0, 8).map(toExpense),
  };
}

const sum = (rows: ExpenseRow[]) => rows.reduce((acc, r) => acc + r.amount, 0);

function groupBy(
  rows: ExpenseRow[],
  keyOf: (row: ExpenseRow) => string,
  labelOf: (row: ExpenseRow) => string,
): Slice[] {
  const slices = new Map<string, Slice>();
  for (const row of rows) {
    const key = keyOf(row);
    const slice = slices.get(key) ?? { key, label: labelOf(row), total: 0, count: 0 };
    slice.total += row.amount;
    slice.count += 1;
    slices.set(key, slice);
  }
  return [...slices.values()];
}

async function anyExpensesExist(): Promise<boolean> {
  const { count, error } = await supabase()
    .from("expenses")
    .select("id", { count: "exact", head: true });
  fail("Could not count expenses", error);
  return (count ?? 0) > 0;
}

/**
 * Every month from the first expense to today, so the switcher never has a gap
 * a user could read as "no data was recorded here".
 */
export async function listMonths(): Promise<string[]> {
  const current = monthOf(todayISO());
  const { data, error } = await supabase()
    .from("expenses")
    .select("spent_at")
    .order("spent_at", { ascending: true })
    .limit(1);
  fail("Could not load the expense history", error);

  const earliest = data?.[0]?.spent_at as string | undefined;
  if (!earliest) return [current];

  const months: string[] = [];
  for (let m = monthOf(earliest); m <= current; m = shiftMonth(m, 1)) months.push(m);
  return months.reverse();
}

/* ------------------------------- settings ------------------------------- */

export async function getSetting(key: string): Promise<string | undefined> {
  const { data, error } = await supabase()
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  fail("Could not load settings", error);
  return (data?.value as string | undefined) ?? undefined;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase().from("settings").upsert({ key, value }, { onConflict: "key" });
  fail("Could not save settings", error);
}

export async function getBudget(): Promise<number> {
  const raw = await getSetting("monthly_budget");
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
}
