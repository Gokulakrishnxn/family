"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { category } from "@/lib/categories";
import { money, moneyExact } from "@/lib/format";

export type BarItem = {
  key: string;
  label: string;
  total: number;
  count: number;
  /** Category id, when the row should show that category's icon. */
  categoryKey?: string;
};

/**
 * One series, ranked by magnitude — so length carries the whole message and
 * every bar wears the same ink. Rank never changes a bar's colour.
 */
export function BarList({ items, emptyLabel = "Nothing here yet." }: { items: BarItem[]; emptyLabel?: string }) {
  const max = Math.max(...items.map((i) => i.total), 1);
  const sum = items.reduce((acc, i) => acc + i.total, 0);

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3.5">
      {items.map((item) => {
        // Icons are resolved here, not passed in: components cannot cross the
        // server/client boundary as props.
        const Icon = item.categoryKey ? category(item.categoryKey).icon : null;
        const share = sum > 0 ? (item.total / sum) * 100 : 0;
        return (
          <li key={item.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  tabIndex={0}
                  className="group cursor-default space-y-1.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
                    <span className="truncate font-medium">{item.label}</span>
                    <span className="num ml-auto shrink-0 font-semibold tabular-nums">{money(item.total)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-[width] duration-500 group-hover:opacity-80"
                      style={{ width: `${Math.max((item.total / max) * 100, item.total > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="num">
                  {moneyExact(item.total)} · {item.count} {item.count === 1 ? "entry" : "entries"} ·{" "}
                  {share.toFixed(0)}% of total
                </span>
              </TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
