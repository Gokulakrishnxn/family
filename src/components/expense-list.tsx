import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { category } from "@/lib/categories";
import { dayLabel, moneyExact } from "@/lib/format";
import type { Expense } from "@/lib/queries";

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No expenses logged yet for this view.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {expenses.map((expense) => {
        const { label, icon: Icon } = category(expense.category);
        return (
          <li key={expense.id} className="contain-item flex items-center gap-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-muted">
              <Icon className="size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{expense.note || label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {expense.member_name} · {expense.note ? `${label} · ` : ""}
                {dayLabel(expense.spent_at)}
              </p>
            </div>

            <span className="num shrink-0 text-sm font-semibold tabular-nums">
              {moneyExact(expense.amount)}
            </span>
            <DeleteExpenseButton id={expense.id} label={`${label} of ${moneyExact(expense.amount)}`} />
          </li>
        );
      })}
    </ul>
  );
}
