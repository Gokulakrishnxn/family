"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
    </Button>
  );
}
