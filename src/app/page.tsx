import Link from "next/link";
import { CalendarCheck, ReceiptText, UserRound, Wallet } from "lucide-react";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money, monthLabel, monthOf, todayISO } from "@/lib/format";
import { getDashboard, listExpenses } from "@/lib/queries";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AddExpensePage() {
  const member = await requireMember();
  const month = monthOf(todayISO());

  const [dashboard, recent] = await Promise.all([getDashboard(month), listExpenses({ limit: 6 })]);
  const share = dashboard.byMember.find((slice) => slice.key === member.id)?.total ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Add an expense</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Logging as <span className="font-medium text-foreground">{member.name}</span> ·{" "}
            {monthLabel(month, { long: true })} ·{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              not you?
            </Link>
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <ExpenseForm memberId={member.id} memberName={member.name} />
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
          <StatTile icon={CalendarCheck} label="Spent today" value={money(dashboard.todayTotal)} />
          <StatTile
            icon={UserRound}
            label={`${member.name}'s share`}
            value={money(share)}
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
