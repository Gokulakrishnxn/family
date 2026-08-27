import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMember, type Member } from "./queries";

/**
 * Who this device is logging as. Deliberately not authentication: there is no
 * password, so this identifies a person, it does not prove who they are.
 */
export const ACTIVE_MEMBER_COOKIE = "family_member";
export const ACTIVE_MEMBER_MAX_AGE = 60 * 60 * 24 * 365;

export async function getActiveMemberId(): Promise<string | undefined> {
  return (await cookies()).get(ACTIVE_MEMBER_COOKIE)?.value;
}

/** Returns null when nobody is chosen, or when the chosen member was removed. */
export async function getActiveMember(): Promise<Member | null> {
  const id = await getActiveMemberId();
  return id ? await getMember(id) : null;
}

export async function requireMember(): Promise<Member> {
  const member = await getActiveMember();
  if (!member) redirect("/login");
  return member;
}
