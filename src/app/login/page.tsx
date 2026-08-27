import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { AddMemberForm } from "@/components/add-member-form";
import { BrandWordmark } from "@/components/brand";
import { MemberPicker } from "@/components/member-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMembers } from "@/lib/queries";
import { getActiveMemberId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const [members, activeId] = await Promise.all([listMembers(), getActiveMemberId()]);
  const firstRun = members.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-[max(1rem,env(safe-area-inset-left))] py-12 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-6">
      <BrandWordmark className="mb-8" />

      <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
        {firstRun ? "Set up your family" : "Who's using this device?"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {firstRun
          ? "Add the first person. Everyone you add here can log expenses into the same shared ledger."
          : "Pick your name to start logging. This device will remember you until you sign out."}
      </p>

      {firstRun ? null : (
        <div className="mt-8">
          <MemberPicker members={members} activeId={activeId} />
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-sm">{firstRun ? "Add the first person" : "Not on the list?"}</CardTitle>
          <CardDescription>
            {firstRun
              ? "A name is enough — the role is just a label on their card."
              : "Add yourself and you'll be signed in straight away."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddMemberForm signIn submitLabel={firstRun ? "Create and continue" : "Add me and continue"} />
        </CardContent>
      </Card>

      <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
        <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        There are no passwords here. Picking a name tells the app whose spending to record — it does not
        keep anyone out, so only use this on devices your household controls.
      </p>
    </div>
  );
}
