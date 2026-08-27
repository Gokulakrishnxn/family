"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, ReceiptText, Users } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { MemberAvatar } from "@/components/member-avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Add", icon: PlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: ReceiptText },
  { href: "/family", label: "Family", icon: Users },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export type ShellMember = { id: string; name: string; role: string };

export function AppShell({ children, member }: { children: React.ReactNode; member: ShellMember | null }) {
  const pathname = usePathname();

  // Signing in has no navigation and no identity to show yet.
  if (pathname === "/login") {
    return (
      <TooltipProvider delayDuration={120}>
        <div className="relative min-h-dvh">
          <div className="absolute top-3 right-3 z-10">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <BrandWordmark />
            </Link>

            {/* Desktop navigation. On small screens this collapses to the bottom bar. */}
            <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive(pathname, href)
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1">
              {member ? (
                <Link
                  href="/login"
                  title="Switch person"
                  className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <MemberAvatar name={member.name} className="size-7" />
                  <span className="hidden max-w-28 truncate sm:inline">{member.name}</span>
                </Link>
              ) : null}
              <ThemeToggle />
              {member ? <SignOutButton /> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 sm:px-6 md:pb-12">{children}</main>

        {/* Thumb-reachable navigation for phones. */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 w-full min-w-0 overflow-x-hidden border-t bg-background/95 backdrop-blur md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="mx-auto grid w-full max-w-md grid-cols-4">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href} className="min-w-0">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                        active && "bg-foreground text-background",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="max-w-full truncate px-1">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </TooltipProvider>
  );
}
