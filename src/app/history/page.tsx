import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { EmptyState } from "@/components/empty-state";
import { ExpenseList } from "@/components/expense-list";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { category } from "@/lib/categories";
import { dayLabel, money, moneyExact, monthLabel, monthOf, todayISO } from "@/lib/format";
import { listExpenses, listMembers, listMonths } from "@/lib/queries";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "History" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; member?: string }>;
}) {
  await requireMember();
  const { month: monthParam, member: memberParam } = await searchParams;
  const [members, months] = await Promise.all([listMembers(), listMonths()]);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : monthOf(todayISO());
  const memberId = members.some((m) => m.id === memberParam) ? memberParam : undefined;

  const expenses = await listExpenses({ month, memberId });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <ReceiptText className="size-5" aria-hidden="true" />
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Every entry, exactly as it was logged.</p>
        </div>
        <FilterBar months={months} members={members} month={month} memberId={memberId} />
      </header>

      {expenses.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No expenses in this view"
          description={`Nothing was logged in ${monthLabel(month, { long: true })} for this selection.`}
          action={{ href: "/", label: "Add an expense" }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {monthLabel(month, { long: true })} · {expenses.length}{" "}
              {expenses.length === 1 ? "entry" : "entries"}
            </CardTitle>
            <CardDescription>
              Total <span className="num font-medium text-foreground">{money(total)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="md:hidden">
              <ExpenseList expenses={expenses} />
            </div>
            {/* Wide columns stay on tablet and up; phones get the list above. */}
            <div className="-mx-2 hidden overflow-x-auto px-2 md:block">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const meta = category(expense.category);
                    const Icon = meta.icon;
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="num whitespace-nowrap text-muted-foreground">
                          {dayLabel(expense.spent_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5 font-normal">
                            <Icon className="size-3.5" aria-hidden="true" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{expense.member_name}</TableCell>
                        <TableCell className="max-w-56 truncate text-muted-foreground">
                          {expense.note || "—"}
                        </TableCell>
                        <TableCell className="num text-right font-semibold whitespace-nowrap tabular-nums">
                          {moneyExact(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <DeleteExpenseButton
                            id={expense.id}
                            label={`${meta.label} of ${moneyExact(expense.amount)}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
