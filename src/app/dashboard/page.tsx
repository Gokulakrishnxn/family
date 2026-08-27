import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, Minus, Receipt } from "lucide-react";
import { BarList, type BarItem } from "@/components/bar-list";
import { EmptyState } from "@/components/empty-state";
import { ExpenseList } from "@/components/expense-list";
import { FilterBar } from "@/components/filter-bar";
import { Inset, Screen, ScreenHeader, SectionLabel } from "@/components/screen";
import { TrendBars } from "@/components/trend-bars";
import { Progress } from "@/components/ui/progress";
import { category } from "@/lib/categories";
import { money, monthLabel, monthOf, todayISO } from "@/lib/format";
import { getBudget, getDashboard, listMembers, listMonths } from "@/lib/queries";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Home" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; member?: string }>;
}) {
  const member = await requireMember();
  const { month: monthParam, member: memberParam } = await searchParams;
  const [members, months] = await Promise.all([listMembers(), listMonths()]);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : monthOf(todayISO());
  const memberId = members.some((m) => m.id === memberParam) ? memberParam : undefined;

  const [data, budget] = await Promise.all([getDashboard(month, memberId), getBudget()]);
  const scopeName = memberId ? members.find((m) => m.id === memberId)!.name : "Everyone";

  const categoryItems: BarItem[] = data.byCategory.map((slice) => ({
    key: slice.key,
    label: category(slice.key).label,
    total: slice.total,
    count: slice.count,
    categoryKey: slice.key,
  }));

  const memberItems: BarItem[] = data.byMember.map((slice) => ({
    key: slice.key,
    label: slice.label,
    total: slice.total,
    count: slice.count,
  }));

  const change = data.changePct;
  const ChangeIcon = change === null ? Minus : change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  const changeText =
    change === null
      ? "No last-month comparison yet"
      : `${change > 0 ? "+" : ""}${change.toFixed(0)}% vs last month`;

  const budgetPct = budget > 0 ? Math.min((data.total / budget) * 100, 100) : 0;

  return (
    <Screen>
      <ScreenHeader title="Home" subtitle={monthLabel(month, { long: true })} person={member} />

      <FilterBar months={months} members={members} month={month} memberId={memberId} />

      {!data.hasAnyExpenses ? (
        <EmptyState
          icon={Receipt}
          title="Nothing here yet"
          description="Add the first expense and this screen fills in — totals, categories, and who spent what."
          action={{ href: "/", label: "Add an expense" }}
        />
      ) : (
        <>
          <div className="px-1">
            <p className="text-[13px] font-medium text-muted-foreground">{scopeName}</p>
            <p className="num mt-1 text-[44px] leading-none font-bold tracking-tight tabular-nums">
              {money(data.total)}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
              <ChangeIcon className="size-3.5" aria-hidden="true" />
              {changeText}
            </p>
          </div>

          <Inset>
            <div className="grid grid-cols-3 divide-x divide-foreground/8">
              <div className="px-3 py-3.5 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">Daily avg</p>
                <p className="num mt-1 text-[15px] font-semibold tabular-nums">{money(data.dailyAverage)}</p>
              </div>
              <div className="px-3 py-3.5 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">Entries</p>
                <p className="num mt-1 text-[15px] font-semibold tabular-nums">{data.count}</p>
              </div>
              <div className="px-3 py-3.5 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">Last month</p>
                <p className="num mt-1 text-[15px] font-semibold tabular-nums">{money(data.previousTotal)}</p>
              </div>
            </div>
          </Inset>

          {budget > 0 && !memberId ? (
            <div>
              <SectionLabel>Budget</SectionLabel>
              <Inset className="px-4 py-4">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="num font-medium">{money(data.total)}</span>
                  <span className="text-muted-foreground">
                    of <span className="num">{money(budget)}</span>
                    {data.total > budget ? ` · over ${money(data.total - budget)}` : ` · ${money(budget - data.total)} left`}
                  </span>
                </div>
                <Progress value={budgetPct} aria-label="Budget used" className="mt-3" />
              </Inset>
            </div>
          ) : null}

          <div>
            <SectionLabel>Where it went</SectionLabel>
            <Inset className="px-4 py-4">
              <BarList items={categoryItems} emptyLabel="No expenses in this month." />
            </Inset>
          </div>

          <div>
            <SectionLabel>Who spent it</SectionLabel>
            <Inset className="px-4 py-4">
              <BarList items={memberItems} emptyLabel="No family members yet." />
            </Inset>
          </div>

          <div>
            <SectionLabel>Six-month trend</SectionLabel>
            <Inset className="px-4 py-4">
              <TrendBars data={data.trend} activeMonth={month} />
            </Inset>
          </div>

          <div>
            <SectionLabel>Recent</SectionLabel>
            <Inset>
              <ExpenseList expenses={data.recent} />
            </Inset>
          </div>
        </>
      )}
    </Screen>
  );
}
