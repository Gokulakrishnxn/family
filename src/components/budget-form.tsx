"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="budget">Monthly budget (₹)</Label>
        <Input
          id="budget"
          name="budget"
          inputMode="decimal"
          placeholder="50000"
          defaultValue={budget > 0 ? String(budget / 100) : ""}
          className="num"
          autoComplete="off"
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending} className="h-11 w-full sm:h-8 sm:w-auto">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
        Save budget
      </Button>
    </form>
  );
}
