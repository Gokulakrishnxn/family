import Link from "next/link";
import { CalendarCheck, ReceiptText, Users, Wallet } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { MemberSwitcher } from "@/components/member-switcher";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveMemberId } from "@/lib/actions";
import { money, monthLabel, monthOf, todayISO } from "@/lib/format";
import {
  getDayTotal,
  getMemberMonthTotal,
  listExpenses,
  listMembers,
  getDashboard,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AddExpensePage() {
  const members = listMembers();

  if (members.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <EmptyState
          icon={Users}
          title="Add your family first"
          description="Everyone who spends needs a name in the app. Once they're added, logging an expense takes two taps."
          action={{ href: "/family", label: "Set up the family" }}
        />
      </div>
    );
  }

  const activeId = (await getActiveMemberId()) ?? members[0].id;
  const active = members.find((m) => m.id === activeId) ?? members[0];
  const month = monthOf(todayISO());
  const dashboard = getDashboard(month);
  const recent = listExpenses({ limit: 6 });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Add an expense</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Logging as <span className="font-medium text-foreground">{active.name}</span> ·{" "}
            {monthLabel(month, { long: true })}
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Who spent it?</CardTitle>
            <CardDescription>Tap a face to switch. The choice is remembered on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberSwitcher members={members} activeId={active.id} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ExpenseForm memberId={active.id} memberName={active.name} />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <StatTile
            emphasis
            icon={Wallet}
            label="Family this month"
            value={money(dashboard.total)}
            hint={`${dashboard.count} ${dashboard.count === 1 ? "entry" : "entries"}`}
          />
          <StatTile
            icon={CalendarCheck}
            label="Spent today"
            value={money(getDayTotal(todayISO()))}
          />
          <StatTile
            icon={Users}
            label={`${active.name}'s share`}
            value={money(getMemberMonthTotal(month, active.id))}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ReceiptText className="size-4" aria-hidden="true" />
              Latest entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseList expenses={recent} />
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/history">See all expenses</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
