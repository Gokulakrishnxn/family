import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { category } from "@/lib/categories";
import { dayLabel, moneyExact } from "@/lib/format";
import type { Expense } from "@/lib/queries";

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">No expenses in this view.</p>;
  }

  return (
    <ul>
      {expenses.map((expense, index) => {
        const { label, icon: Icon } = category(expense.category);
        return (
          <li key={expense.id}>
            {index > 0 ? <div className="mx-4 h-px bg-foreground/8" /> : null}
            <div className="contain-item flex items-center gap-3 px-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{expense.note || label}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {expense.member_name} · {expense.note ? `${label} · ` : ""}
                  {dayLabel(expense.spent_at)}
                </p>
              </div>
              <span className="num shrink-0 text-[15px] font-semibold tabular-nums">
                {moneyExact(expense.amount)}
              </span>
              <DeleteExpenseButton id={expense.id} label={`${label} of ${moneyExact(expense.amount)}`} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
