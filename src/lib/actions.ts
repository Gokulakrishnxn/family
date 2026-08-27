"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createExpense,
  createMember,
  deleteExpense,
  deleteMember,
  getMember,
  renameMember,
  setSetting,
} from "./queries";
import { ACTIVE_MEMBER_COOKIE, ACTIVE_MEMBER_MAX_AGE, getActiveMemberId } from "./session";
import { CATEGORY_IDS } from "./categories";
import { toPaise } from "./format";

export type ActionState = { ok: boolean; message: string };

function refresh() {
  revalidatePath("/", "layout");
}

async function rememberMember(memberId: string) {
  (await cookies()).set(ACTIVE_MEMBER_COOKIE, memberId, {
    maxAge: ACTIVE_MEMBER_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}

/* -------------------------------- session ------------------------------- */

/** Passwordless: picking a name is the whole sign-in. */
export async function signInAction(memberId: string): Promise<void> {
  if (!(await getMember(memberId))) return;
  await rememberMember(memberId);
  refresh();
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  (await cookies()).delete(ACTIVE_MEMBER_COOKIE);
  refresh();
  redirect("/login");
}

/* ------------------------------- expenses ------------------------------- */

export async function addExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const memberId = String(formData.get("memberId") ?? "");
  const category = String(formData.get("category") ?? "");
  const rawAmount = String(formData.get("amount") ?? "");
  const note = String(formData.get("note") ?? "");
  const spentAt = String(formData.get("spentAt") ?? "");

  if (!memberId || !(await getMember(memberId))) return { ok: false, message: "Sign in again to log this." };
  if (!CATEGORY_IDS.includes(category as never)) return { ok: false, message: "Pick a category." };

  const amount = toPaise(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Enter an amount above zero." };
  if (amount > 100_000_000_00) return { ok: false, message: "That amount looks too large." };

  await createExpense({ memberId, amount, category, note, spentAt });
  refresh();
  return { ok: true, message: "Expense added." };
}

export async function removeExpenseAction(expenseId: string): Promise<void> {
  await deleteExpense(expenseId);
  refresh();
}

/* -------------------------------- members ------------------------------- */

export async function addMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const thenSignIn = formData.get("signIn") === "1";

  if (name.length < 2) return { ok: false, message: "Name needs at least 2 characters." };
  if (name.length > 40) return { ok: false, message: "Name is too long." };

  const member = await createMember(name, role);
  const firstOne = !(await getActiveMemberId());
  if (thenSignIn || firstOne) await rememberMember(member.id);
  refresh();

  // Adding yourself on the way in should drop you straight into the app.
  if (thenSignIn) redirect("/");
  return { ok: true, message: `${member.name} joined the family.` };
}

export async function updateMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!(await getMember(id))) return { ok: false, message: "That member no longer exists." };
  if (name.length < 2) return { ok: false, message: "Name needs at least 2 characters." };

  await renameMember(id, name, role);
  refresh();
  return { ok: true, message: "Saved." };
}

export async function removeMemberAction(memberId: string): Promise<void> {
  await deleteMember(memberId);
  if ((await getActiveMemberId()) === memberId) {
    (await cookies()).delete(ACTIVE_MEMBER_COOKIE);
  }
  refresh();
}

/* ------------------------------- settings ------------------------------- */

export async function setBudgetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = String(formData.get("budget") ?? "").trim();
  if (raw === "") {
    await setSetting("monthly_budget", "0");
    refresh();
    return { ok: true, message: "Budget cleared." };
  }

  const paise = toPaise(raw);
  if (!Number.isFinite(paise) || paise < 0) return { ok: false, message: "Enter a valid budget." };
  await setSetting("monthly_budget", String(paise));
  refresh();
  return { ok: true, message: "Monthly budget updated." };
}
