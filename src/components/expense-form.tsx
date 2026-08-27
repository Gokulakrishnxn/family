"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarDays, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addExpenseAction, type ActionState } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const INITIAL: ActionState = { ok: false, message: "" };
const QUICK_ADD = [100, 500, 1000, 2000];

export function ExpenseForm({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [state, formAction, pending] = useActionState(addExpenseAction, INITIAL);
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      // The form is uncontrolled, so a native reset is all the clearing needed.
      formRef.current?.reset();
      amountRef.current?.focus();
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const setAmount = (value: string) => {
    const field = amountRef.current;
    if (!field) return;
    field.value = value;
    field.focus();
  };

  const bump = (rupees: number) => {
    const current = Number.parseFloat(amountRef.current?.value ?? "") || 0;
    setAmount(String(Math.round((current + rupees) * 100) / 100));
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="category" value={category} />

      {/* Amount ------------------------------------------------------------ */}
      <div className="space-y-3">
        <Label htmlFor="amount" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Amount
        </Label>
        <div className="flex items-baseline gap-2 border-b-2 pb-2 focus-within:border-foreground">
          <span aria-hidden="true" className="text-3xl font-semibold text-muted-foreground sm:text-4xl">
            ₹
          </span>
          <input
            ref={amountRef}
            id="amount"
            name="amount"
            defaultValue=""
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            aria-describedby="amount-hint"
            className="num w-full min-w-0 bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span id="amount-hint" className="sr-only">
            Enter the amount in rupees, or use the quick-add buttons.
          </span>
          {QUICK_ADD.map((value) => (
            <Button key={value} type="button" variant="outline" size="sm" onClick={() => bump(value)}>
              +{value.toLocaleString("en-IN")}
            </Button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setAmount("")}>
            Clear
          </Button>
        </div>
      </div>

      {/* Category ---------------------------------------------------------- */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Category
        </legend>
        <div
          role="radiogroup"
          aria-label="Category"
          className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 lg:grid-cols-6"
        >
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const selected = category === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCategory(id)}
                className={cn(
                  "tap flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-muted active:bg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="text-[11px] leading-tight font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Note + date ------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="note">Note <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="note" name="note" maxLength={120} placeholder="Weekly vegetables" autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spentAt" className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Date
          </Label>
          <Input
            id="spentAt"
            name="spentAt"
            type="date"
            defaultValue={todayISO()}
            max={todayISO()}
            className="num"
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full text-base">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Adding…
          </>
        ) : (
          <>
            <Plus className="size-4" aria-hidden="true" />
            Add expense as {memberName}
          </>
        )}
      </Button>
    </form>
  );
}
