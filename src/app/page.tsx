import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { Inset, Screen, ScreenHeader, SectionLabel } from "@/components/screen";
import { money, monthLabel, monthOf, todayISO } from "@/lib/format";
import { getDashboard, listExpenses } from "@/lib/queries";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AddExpensePage() {
  const member = await requireMember();
  const month = monthOf(todayISO());

  const [dashboard, recent] = await Promise.all([getDashboard(month), listExpenses({ limit: 4 })]);
  const share = dashboard.byMember.find((slice) => slice.key === member.id)?.total ?? 0;

  return (
    <Screen>
      <ScreenHeader
        title="Add"
        subtitle={`Logging as ${member.name}`}
        person={member}
      />

      <Inset>
        <div className="grid grid-cols-3 divide-x divide-foreground/8">
          <div className="px-3 py-3.5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground">Family</p>
            <p className="num mt-1 text-[15px] font-semibold tabular-nums">{money(dashboard.total)}</p>
          </div>
          <div className="px-3 py-3.5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground">Today</p>
            <p className="num mt-1 text-[15px] font-semibold tabular-nums">{money(dashboard.todayTotal)}</p>
          </div>
          <div className="px-3 py-3.5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground">You</p>
            <p className="num mt-1 text-[15px] font-semibold tabular-nums">{money(share)}</p>
          </div>
        </div>
      </Inset>

      <ExpenseForm memberId={member.id} memberName={member.name} />

      {recent.length > 0 ? (
        <div>
          <SectionLabel>{monthLabel(month, { long: true })}</SectionLabel>
          <Inset>
            <ExpenseList expenses={recent} />
            <Link
              href="/history"
              className="tap flex items-center justify-between border-t border-foreground/8 px-4 py-3.5 text-[15px] font-medium"
            >
              See all activity
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </Inset>
        </div>
      ) : null}
    </Screen>
  );
}
