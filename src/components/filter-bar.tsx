"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { monthLabel } from "@/lib/format";
import type { Member } from "@/lib/queries";
import { cn } from "@/lib/utils";

const EVERYONE = "everyone";

export function FilterBar({
  months,
  members,
  month,
  memberId,
}: {
  months: string[];
  members: Member[];
  month: string;
  memberId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const push = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === EVERYONE || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    startTransition(() => router.push(qs ? `?${qs}` : "?", { scroll: false }));
  };

  return (
    <div className={cn("space-y-2", pending && "opacity-70")}>
      <div className="chip-row" role="tablist" aria-label="Month">
        {months.map((m) => {
          const selected = m === month;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => push("month", m)}
              className={cn(
                "tap h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium",
                selected ? "bg-foreground text-background" : "bg-card text-foreground ring-1 ring-foreground/10",
              )}
            >
              {monthLabel(m, { long: true })}
            </button>
          );
        })}
      </div>

      {members.length > 0 ? (
        <div className="chip-row" role="tablist" aria-label="Family member">
          <button
            type="button"
            role="tab"
            aria-selected={!memberId}
            onClick={() => push("member", EVERYONE)}
            className={cn(
              "tap h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium",
              !memberId ? "bg-foreground text-background" : "bg-card text-foreground ring-1 ring-foreground/10",
            )}
          >
            Everyone
          </button>
          {members.map((m) => {
            const selected = m.id === memberId;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => push("member", m.id)}
                className={cn(
                  "tap h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium",
                  selected ? "bg-foreground text-background" : "bg-card text-foreground ring-1 ring-foreground/10",
                )}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
