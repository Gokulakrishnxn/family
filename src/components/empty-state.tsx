import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-card ring-1 ring-foreground/10">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-[17px] font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted-foreground">{description}</p>
      {action ? (
        <Button asChild className="mt-5 h-11 rounded-full px-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
