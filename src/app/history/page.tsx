import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExpenseList } from "@/components/expense-list";
import { FilterBar } from "@/components/filter-bar";
import { Inset, Screen, ScreenHeader, SectionLabel } from "@/components/screen";
import { money, monthLabel, monthOf, todayISO } from "@/lib/format";
import { listExpenses, listMembers, listMonths } from "@/lib/queries";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activity" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; member?: string }>;
}) {
  const member = await requireMember();
  const { month: monthParam, member: memberParam } = await searchParams;
  const [members, months] = await Promise.all([listMembers(), listMonths()]);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : monthOf(todayISO());
  const memberId = members.some((m) => m.id === memberParam) ? memberParam : undefined;

  const expenses = await listExpenses({ month, memberId });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Screen>
      <ScreenHeader title="Activity" subtitle="Every entry, as it was logged" person={member} />

      <FilterBar months={months} members={members} month={month} memberId={memberId} />

      {expenses.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No activity"
          description={`Nothing was logged in ${monthLabel(month, { long: true })} for this selection.`}
          action={{ href: "/", label: "Add an expense" }}
        />
      ) : (
        <div>
          <SectionLabel>
            {expenses.length} {expenses.length === 1 ? "entry" : "entries"} · {money(total)}
          </SectionLabel>
          <Inset>
            <ExpenseList expenses={expenses} />
          </Inset>
        </div>
      )}
    </Screen>
  );
}
