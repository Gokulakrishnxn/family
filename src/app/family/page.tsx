import type { Metadata } from "next";
import { AddMemberForm } from "@/components/add-member-form";
import { BudgetForm } from "@/components/budget-form";
import { MemberAvatar } from "@/components/member-avatar";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { Inset, Screen, ScreenHeader, SectionLabel } from "@/components/screen";
import { SettingsRows } from "@/components/settings-rows";
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
    <Screen>
      <ScreenHeader
        title="Family"
        subtitle="One ledger. Everyone logs what they spend."
        person={active}
      />

      <div>
        <SectionLabel>Add someone</SectionLabel>
        <Inset className="px-4 py-4">
          <AddMemberForm />
        </Inset>
      </div>

      <div>
        <SectionLabel>
          People {members.length > 0 ? `· ${monthLabel(month, { long: true })}` : ""}
        </SectionLabel>
        <Inset>
          {members.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No one has been added yet. Start with yourself.
            </p>
          ) : (
            <ul>
              {members.map((member, index) => {
                const slice = totals.get(member.id);
                return (
                  <li key={member.id}>
                    {index > 0 ? <div className="mx-4 h-px bg-foreground/8" /> : null}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <MemberAvatar name={member.name} active={member.id === active.id} className="rounded-full" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[15px] font-medium">
                          <span className="truncate">{member.name}</span>
                          {member.id === active.id ? (
                            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">You</span>
                          ) : null}
                        </p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {member.role || "Family member"} · {slice?.count ?? 0}{" "}
                          {(slice?.count ?? 0) === 1 ? "entry" : "entries"}
                        </p>
                      </div>
                      <span className="num shrink-0 text-[15px] font-semibold tabular-nums">
                        {money(slice?.total ?? 0)}
                      </span>
                      <RemoveMemberButton
                        id={member.id}
                        name={member.name}
                        expenseCount={lifetimeCounts.get(member.id) ?? 0}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Inset>
      </div>

      <div>
        <SectionLabel>Monthly budget</SectionLabel>
        <Inset className="px-4 py-4">
          <p className="mb-3 text-[13px] text-muted-foreground">
            Set a ceiling and Home tracks how much is gone. Leave empty to hide it.
          </p>
          <BudgetForm budget={budget} />
        </Inset>
      </div>

      <div>
        <SectionLabel>Settings</SectionLabel>
        <SettingsRows />
      </div>
    </Screen>
  );
}
