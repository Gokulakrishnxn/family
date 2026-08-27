"use client";

import { useTransition } from "react";
import { ChevronRight, Loader2, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { signOutAction } from "@/lib/actions";
import { Inset } from "@/components/screen";

export function SettingsRows() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const [pending, startTransition] = useTransition();

  return (
    <Inset>
      <button
        type="button"
        onClick={toggle}
        className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
        <span className="flex-1 text-[15px] font-medium">Appearance</span>
        <span className="text-[13px] text-muted-foreground">{isDark ? "Dark" : "Light"}</span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </button>
      <div className="mx-4 h-px bg-foreground/8" />
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => signOutAction())}
        className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {pending ? <Loader2 className="size-5 animate-spin" /> : <LogOut className="size-5" />}
        <span className="flex-1 text-[15px] font-medium">Sign out</span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </button>
    </Inset>
  );
}
