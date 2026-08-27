"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarRange, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthLabel } from "@/lib/format";
import type { Member } from "@/lib/queries";
import { cn } from "@/lib/utils";

const EVERYONE = "everyone";

/** One row of filters above the charts, as a dashboard should have. */
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
    <div className={cn("flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center", pending && "opacity-70")}>
      <Select value={month} onValueChange={(v) => push("month", v)}>
        <SelectTrigger className="h-11 w-full sm:h-8 sm:w-[150px]" aria-label="Month">
          <CalendarRange className="size-4 opacity-70" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {monthLabel(m, { long: true })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {members.length > 0 ? (
        <Select value={memberId ?? EVERYONE} onValueChange={(v) => push("member", v)}>
          <SelectTrigger className="h-11 w-full sm:h-8 sm:w-[160px]" aria-label="Family member">
            <Users className="size-4 opacity-70" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={EVERYONE}>Everyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
