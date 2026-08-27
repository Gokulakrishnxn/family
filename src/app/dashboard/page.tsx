import type { Metadata } from "next";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  LayoutDashboard,
  Minus,
  PiggyBank,
  Receipt,
  Wallet,
} from "lucide-react";
import { BarList, type BarItem } from "@/components/bar-list";
import { EmptyState } from "@/components/empty-state";
import { ExpenseList } from "@/components/expense-list";
import { FilterBar } from "@/components/filter-bar";
import { StatTile } from "@/components/stat-tile";
import { TrendBars } from "@/components/trend-bars";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { category } from "@/lib/categories";
import { money, monthLabel, monthOf, todayISO } from "@/lib/format";
import { getBudget, getDashboard, listMembers, listMonths } from "@/lib/queries";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; member?: string }>;
}) {
  await requireMember();
  const { month: monthParam, member: memberParam } = await searchParams;
  const [members, months] = await Promise.all([listMembers(), listMonths()]);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : monthOf(todayISO());
  const memberId = members.some((m) => m.id === memberParam) ? memberParam : undefined;

  const [data, budget] = await Promise.all([getDashboard(month, memberId), getBudget()]);
  const scopeName = memberId ? members.find((m) => m.id === memberId)!.name : "the family";

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
      ? "No spending last month to compare"
      : `${change > 0 ? "+" : ""}${change.toFixed(0)}% vs last month`;

  const budgetPct = budget > 0 ? Math.min((data.total / budget) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <LayoutDashboard className="size-5" aria-hidden="true" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {monthLabel(month, { long: true })} · {scopeName}
          </p>
        </div>
        <FilterBar months={months} members={members} month={month} memberId={memberId} />
      </header>

      {!data.hasAnyExpenses ? (
        <EmptyState
          icon={Receipt}
          title="Nothing to chart yet"
          description="Add your first expense and this dashboard fills in — totals, categories, who spent what, and a six-month trend."
          action={{ href: "/", label: "Add an expense" }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              emphasis
              icon={Wallet}
              label="Total this month"
              value={money(data.total)}
              hint={
                <span className="inline-flex items-center gap-1">
                  <ChangeIcon className="size-3" aria-hidden="true" />
                  {changeText}
                </span>
              }
            />
            <StatTile
              icon={CalendarDays}
              label="Daily average"
              value={money(data.dailyAverage)}
              hint="Across days elapsed this month"
            />
            <StatTile
              icon={Receipt}
              label="Entries"
              value={String(data.count)}
              hint={data.count > 0 ? `Avg ${money(Math.round(data.total / data.count))} each` : "No entries yet"}
            />
            <StatTile
              icon={PiggyBank}
              label="Last month"
              value={money(data.previousTotal)}
              hint="Same scope, previous month"
            />
          </div>

          {budget > 0 && !memberId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Monthly budget</CardTitle>
                <CardDescription>
                  <span className="num">{money(data.total)}</span> of{" "}
                  <span className="num">{money(budget)}</span> used
                  {data.total > budget ? (
                    <> — <span className="font-medium text-foreground">over by {money(data.total - budget)}</span></>
                  ) : (
                    <> — {money(budget - data.total)} left</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={budgetPct} aria-label="Budget used" />
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Where it went</CardTitle>
                <CardDescription>Spending by category, {monthLabel(month, { long: true })}</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList items={categoryItems} emptyLabel="No expenses in this month." />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Who spent it</CardTitle>
                <CardDescription>Every family member, including the quiet ones</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList items={memberItems} emptyLabel="No family members yet." />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Six-month trend</CardTitle>
              <CardDescription>Monthly totals, ending with the month in view</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendBars data={data.trend} activeMonth={month} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent expenses</CardTitle>
              <CardDescription>The last few entries in this view</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseList expenses={data.recent} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
