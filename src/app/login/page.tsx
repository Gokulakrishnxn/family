import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { AddMemberForm } from "@/components/add-member-form";
import { BrandMark } from "@/components/brand";
import { MemberPicker } from "@/components/member-picker";
import { Inset, SectionLabel } from "@/components/screen";
import { listMembers } from "@/lib/queries";
import { getActiveMemberId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const [members, activeId] = await Promise.all([listMembers(), getActiveMemberId()]);
  const firstRun = members.length === 0;

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-[max(3.5rem,calc(env(safe-area-inset-top)+2.5rem))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mb-8">
        <BrandMark className="size-14" />
        <h1 className="mt-5 text-[32px] leading-none font-bold tracking-tight">
          {firstRun ? "Set up your family" : "Who’s this?"}
        </h1>
        <p className="mt-2 text-[15px] leading-snug text-muted-foreground">
          {firstRun
            ? "Add the first person. Everyone you add can log into the same ledger."
            : "Pick your name. This phone will remember you."}
        </p>
      </div>

      {firstRun ? null : (
        <div className="mb-8">
          <MemberPicker members={members} activeId={activeId} />
        </div>
      )}

      <div className="mt-auto">
        <SectionLabel>{firstRun ? "First person" : "Not on the list?"}</SectionLabel>
        <Inset className="px-4 py-4">
          <AddMemberForm signIn submitLabel={firstRun ? "Create and continue" : "Add me"} />
        </Inset>
        <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
          <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          No passwords. A name only says whose spending to record — use this on household phones.
        </p>
      </div>
    </div>
  );
}
