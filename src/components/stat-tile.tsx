import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A headline number. No plot, no chart chrome — the value is the visual.
 */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  emphasis = false,
  className,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        emphasis ? "bg-foreground text-background" : "bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="size-4 opacity-70" aria-hidden="true" /> : null}
        <span
          className={cn(
            "text-xs font-medium tracking-wide uppercase",
            emphasis ? "opacity-70" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>
      <p className="num mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      {hint ? (
        <p className={cn("mt-1 text-xs", emphasis ? "opacity-70" : "text-muted-foreground")}>{hint}</p>
      ) : null}
    </div>
  );
}
