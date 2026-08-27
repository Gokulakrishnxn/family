import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import { cn } from "@/lib/utils";

export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-5", className)}>{children}</div>;
}

export function ScreenHeader({
  title,
  subtitle,
  person,
}: {
  title: string;
  subtitle?: React.ReactNode;
  person?: { name: string };
}) {
  return (
    <header className="flex items-start justify-between gap-3 pt-1">
      <div className="min-w-0">
        <h1 className="text-[32px] leading-none font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-[13px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      {person ? (
        <Link
          href="/login"
          title="Switch person"
          className="tap mt-0.5 shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MemberAvatar name={person.name} className="size-10 rounded-full" />
        </Link>
      ) : null}
    </header>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mb-2 px-1 text-[13px] font-medium text-muted-foreground", className)}>{children}</p>
  );
}

export function Inset({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-[20px] bg-card ring-1 ring-foreground/8", className)}>
      {children}
    </section>
  );
}
