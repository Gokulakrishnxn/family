"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, List, Plus, Users } from "lucide-react";
import { PageMotion } from "@/components/page-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Add", icon: Plus },
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/history", label: "Activity", icon: List },
  { href: "/family", label: "Family", icon: Users },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export type ShellMember = { id: string; name: string; role: string };

export function AppShell({ children }: { children: React.ReactNode; member: ShellMember | null }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return (
      <TooltipProvider delayDuration={120}>
        <div className="app-stage">
          <div className="app-frame relative">
            <div
              className="absolute z-10"
              style={{
                top: "max(0.75rem, env(safe-area-inset-top))",
                right: "max(0.75rem, env(safe-area-inset-right))",
              }}
            >
              <ThemeToggle className="size-11" />
            </div>
            <PageMotion>{children}</PageMotion>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="app-stage">
        <div className="app-frame flex min-h-dvh flex-col">
          <main
            className="flex-1 px-5 pt-[max(0.75rem,env(safe-area-inset-top))]"
            style={{ paddingBottom: "calc(6.25rem + env(safe-area-inset-bottom))" }}
          >
            <PageMotion>{children}</PageMotion>
          </main>

          <nav
            aria-label="Main"
            className="fixed inset-x-0 bottom-0 z-40 isolate px-3 transform-gpu"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <ul className="mx-auto grid max-w-[430px] grid-cols-4 gap-0.5 rounded-[22px] bg-card p-1.5 ring-1 ring-foreground/10 shadow-[0_10px_40px_oklch(0_0_0/0.14)]">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href} className="min-w-0">
                    <Link
                      href={href}
                      prefetch
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "tap flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[16px] text-[10px] font-semibold tracking-wide",
                        active ? "bg-foreground text-background" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </TooltipProvider>
  );
}
