"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { signInAction } from "@/lib/actions";
import type { Member } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function MemberPicker({ members, activeId }: { members: Member[]; activeId?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="grid grid-cols-2 gap-3">
      {members.map((member) => {
        const active = member.id === activeId;
        return (
          <li key={member.id}>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => signInAction(member.id))}
              className={cn(
                "tap relative flex w-full flex-col items-center justify-center gap-2 rounded-[22px] bg-card px-3 py-6 text-center ring-1 ring-foreground/10 outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
                active && "ring-2 ring-foreground",
              )}
            >
              <MemberAvatar name={member.name} active={active} className="size-14 rounded-full" />
              <span className="max-w-full truncate text-[15px] font-semibold">{member.name}</span>
              {member.role ? (
                <span className="max-w-full truncate text-[12px] text-muted-foreground">{member.role}</span>
              ) : null}
              {active ? (
                <Check className="absolute top-3 right-3 size-4" aria-hidden="true" />
              ) : null}
            </button>
          </li>
        );
      })}
      {pending ? (
        <li className="sr-only" aria-live="polite">
          <Loader2 aria-hidden="true" /> Signing in…
        </li>
      ) : null}
    </ul>
  );
}
