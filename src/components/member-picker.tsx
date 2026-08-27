"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { signInAction } from "@/lib/actions";
import type { Member } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Pick a name to continue. There is no password — see the note on /login. */
export function MemberPicker({ members, activeId }: { members: Member[]; activeId?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {members.map((member) => {
        const active = member.id === activeId;
        return (
          <li key={member.id}>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => signInAction(member.id))}
              className={cn(
                "tap relative flex w-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-5 text-center outline-none",
                "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
                active && "border-foreground bg-muted",
              )}
            >
              <MemberAvatar name={member.name} active={active} className="size-12" />
              <span className="max-w-full truncate text-sm font-medium">{member.name}</span>
              {member.role ? (
                <span className="max-w-full truncate text-xs text-muted-foreground">{member.role}</span>
              ) : null}
              {active ? <Check className="absolute top-2.5 right-2.5 size-4" aria-hidden="true" /> : null}
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
