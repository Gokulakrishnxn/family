import type { Metadata } from "next";
import { Target, Users } from "lucide-react";
import { AddMemberForm } from "@/components/add-member-form";
import { BudgetForm } from "@/components/budget-form";
import { MemberAvatar } from "@/components/member-avatar";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { money, monthLabel, monthOf, todayISO } from "@/lib/format";
import { countExpensesByMember, getBudget, getDashboard, listMembers } from "@/lib/queries";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Family" };

export default async function FamilyPage() {
  const active = await requireMember();
  const month = monthOf(todayISO());

  const [members, { byMember }, budget] = await Promise.all([
    listMembers(),
    getDashboard(month),
    getBudget(),
  ]);
  const lifetimeCounts = await countExpensesByMember(members.map((m) => m.id));
  const totals = new Map(byMember.map((slice) => [slice.key, slice]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <Users className="size-5" aria-hidden="true" />
          Family
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone here shares one ledger. Whoever opens the app picks their name, then logs what they spent.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add a family member</CardTitle>
          <CardDescription>A name is enough — the role is just a label on their card.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddMemberForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Members {members.length > 0 ? `(${members.length})` : ""}
          </CardTitle>
          <CardDescription>Totals shown for {monthLabel(month, { long: true })}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No one has been added yet. Start with yourself.
            </p>
          ) : (
            <ul className="divide-y">
              {members.map((member) => {
                const slice = totals.get(member.id);
                return (
                  <li key={member.id} className="flex items-center gap-3 py-3">
                    <MemberAvatar name={member.name} active={member.id === active.id} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{member.name}</span>
                        {member.id === active.id ? (
                          <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            you
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.role || "Family member"} · {slice?.count ?? 0}{" "}
                        {(slice?.count ?? 0) === 1 ? "entry" : "entries"} this month
                      </p>
                    </div>
                    <span className="num shrink-0 text-sm font-semibold tabular-nums">
                      {money(slice?.total ?? 0)}
                    </span>
                    <RemoveMemberButton
                      id={member.id}
                      name={member.name}
                      expenseCount={lifetimeCounts.get(member.id) ?? 0}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="size-4" aria-hidden="true" />
            Household budget
          </CardTitle>
          <CardDescription>
            Set a monthly ceiling and the dashboard tracks how much of it is gone. Leave it empty to hide it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetForm budget={budget} />
        </CardContent>
      </Card>
    </div>
  );
}
