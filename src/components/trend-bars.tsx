"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { money, moneyExact, monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Bars top out at 88% of the plot so the value label always has room above. */
const PLOT_FILL = 0.88;

/**
 * Six months of totals. The month in view is inked solid; the rest recede to a
 * lighter grey, so the comparison reads without a legend.
 */
export function TrendBars({
  data,
  activeMonth,
}: {
  data: { month: string; total: number }[];
  activeMonth: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {data.map((d) => {
          const active = d.month === activeMonth;
          const height = d.total > 0 ? Math.max((d.total / max) * 100 * PLOT_FILL, 3) : 1.5;
          return (
            <Tooltip key={d.month}>
              <TooltipTrigger asChild>
                <div
                  tabIndex={0}
                  className="flex h-full flex-1 cursor-default flex-col justify-end gap-1.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    className={cn(
                      "num shrink-0 text-center text-[10px] font-semibold tabular-nums sm:text-xs",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {d.total > 0 ? money(d.total) : "—"}
                  </span>
                  {/* shrink-0 keeps the percentage height from being squeezed by the label. */}
                  <div
                    style={{ height: `${height}%` }}
                    className={cn(
                      "w-full shrink-0 rounded-t-[4px] transition-colors",
                      active ? "bg-foreground" : "bg-foreground/20 hover:bg-foreground/35",
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="num">
                  {monthLabel(d.month, { long: true })} · {moneyExact(d.total)}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* A single baseline under the plot, with the months hung off it. */}
      <div className="mt-2 flex gap-2 border-t pt-2 sm:gap-3">
        {data.map((d) => (
          <span
            key={d.month}
            className={cn(
              "flex-1 text-center text-[10px] sm:text-xs",
              d.month === activeMonth ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {monthLabel(d.month)}
          </span>
        ))}
      </div>
    </div>
  );
}
