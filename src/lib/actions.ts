"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  createExpense,
  createMember,
  deleteExpense,
  deleteMember,
  getMember,
  renameMember,
  setSetting,
} from "./queries";
import { CATEGORY_IDS } from "./categories";
import { toPaise } from "./format";

export type ActionState = { ok: boolean; message: string };

const ACTIVE_MEMBER_COOKIE = "family_active_member";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function refresh() {
  revalidatePath("/", "layout");
}

export async function getActiveMemberId(): Promise<string | undefined> {
  const id = (await cookies()).get(ACTIVE_MEMBER_COOKIE)?.value;
  return id && getMember(id) ? id : undefined;
}

export async function setActiveMember(memberId: string): Promise<void> {
  (await cookies()).set(ACTIVE_MEMBER_COOKIE, memberId, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  refresh();
}

export async function addExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const memberId = String(formData.get("memberId") ?? "");
  const category = String(formData.get("category") ?? "");
  const rawAmount = String(formData.get("amount") ?? "");
  const note = String(formData.get("note") ?? "");
  const spentAt = String(formData.get("spentAt") ?? "");

  if (!memberId || !getMember(memberId)) return { ok: false, message: "Pick who spent it." };
  if (!CATEGORY_IDS.includes(category as never)) return { ok: false, message: "Pick a category." };

  const amount = toPaise(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Enter an amount above zero." };
  if (amount > 100_000_000_00) return { ok: false, message: "That amount looks too large." };

  createExpense({ memberId, amount, category, note, spentAt });
  refresh();
  return { ok: true, message: "Expense added." };
}

export async function addMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (name.length < 2) return { ok: false, message: "Name needs at least 2 characters." };
  if (name.length > 40) return { ok: false, message: "Name is too long." };

  const member = createMember(name, role);
  if (!(await getActiveMemberId())) await setActiveMember(member.id);
  refresh();
  return { ok: true, message: `${member.name} joined the family.` };
}

export async function updateMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!getMember(id)) return { ok: false, message: "That member no longer exists." };
  if (name.length < 2) return { ok: false, message: "Name needs at least 2 characters." };

  renameMember(id, name, role);
  refresh();
  return { ok: true, message: "Saved." };
}

export async function removeMemberAction(memberId: string): Promise<void> {
  deleteMember(memberId);
  if ((await getActiveMemberId()) === memberId) {
    (await cookies()).delete(ACTIVE_MEMBER_COOKIE);
  }
  refresh();
}

export async function removeExpenseAction(expenseId: string): Promise<void> {
  deleteExpense(expenseId);
  refresh();
}

export async function setBudgetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = String(formData.get("budget") ?? "").trim();
  if (raw === "") {
    setSetting("monthly_budget", "0");
    refresh();
    return { ok: true, message: "Budget cleared." };
  }
  const paise = toPaise(raw);
  if (!Number.isFinite(paise) || paise < 0) return { ok: false, message: "Enter a valid budget." };
  setSetting("monthly_budget", String(paise));
  refresh();
  return { ok: true, message: "Monthly budget updated." };
}
