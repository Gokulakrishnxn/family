"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setBudgetAction, type ActionState } from "@/lib/actions";

const INITIAL: ActionState = { ok: false, message: "" };

export function BudgetForm({ budget }: { budget: number }) {
  const [state, formAction, pending] = useActionState(setBudgetAction, INITIAL);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input
        id="budget"
        name="budget"
        inputMode="decimal"
        placeholder="50000"
        defaultValue={budget > 0 ? String(budget / 100) : ""}
        autoComplete="off"
        className="num h-12 w-full rounded-2xl bg-muted px-4 text-[15px] outline-none placeholder:text-muted-foreground/60"
      />
      <Button type="submit" variant="outline" disabled={pending} className="h-12 w-full rounded-2xl text-[15px] font-semibold">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
        Save budget
      </Button>
    </form>
  );
}
