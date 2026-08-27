"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { setActiveMember } from "@/lib/actions";
import type { Member } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function MemberSwitcher({
  members,
  activeId,
}: {
  members: Member[];
  activeId?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label="Who spent this"
      className={cn(
        "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        pending && "opacity-60",
      )}
    >
      {members.map((member) => {
        const active = member.id === activeId;
        return (
          <button
            key={member.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            onClick={() => startTransition(() => setActiveMember(member.id))}
            className={cn(
              "group relative flex min-w-24 shrink-0 flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-center transition-colors",
              active ? "border-foreground bg-muted" : "hover:bg-muted/60",
            )}
          >
            <MemberAvatar name={member.name} active={active} />
            <span className="max-w-20 truncate text-xs font-medium">{member.name}</span>
            {member.role ? (
              <span className="max-w-20 truncate text-[10px] text-muted-foreground">{member.role}</span>
            ) : null}
            {active ? (
              <Check className="absolute top-1.5 right-1.5 size-3.5" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
