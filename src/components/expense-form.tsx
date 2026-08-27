"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addExpenseAction, type ActionState } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Inset } from "@/components/screen";

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
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="category" value={category} />

      <div className="text-center">
        <label htmlFor="amount" className="sr-only">
          Amount
        </label>
        <div className="flex items-center justify-center gap-1">
          <span aria-hidden="true" className="text-[40px] font-bold text-muted-foreground">
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
            className="num w-full min-w-0 max-w-[220px] bg-transparent text-center text-[52px] leading-none font-bold tracking-tight outline-none placeholder:text-muted-foreground/35"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span id="amount-hint" className="sr-only">
            Enter the amount in rupees, or use the quick-add buttons.
          </span>
          {QUICK_ADD.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => bump(value)}
              className="tap h-9 rounded-full bg-card px-3.5 text-[13px] font-medium ring-1 ring-foreground/10"
            >
              +{value.toLocaleString("en-IN")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount("")}
            className="tap h-9 rounded-full px-3 text-[13px] font-medium text-muted-foreground"
          >
            Clear
          </button>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">Category</legend>
        <div role="radiogroup" aria-label="Category" className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const selected = category === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCategory(id)}
                className="tap flex flex-col items-center gap-1.5 py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    selected ? "bg-foreground text-background" : "bg-card ring-1 ring-foreground/10",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-[11px] leading-tight font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Inset>
        <label className="flex items-center gap-3 px-4">
          <span className="w-16 shrink-0 text-[15px] text-muted-foreground">Note</span>
          <input
            id="note"
            name="note"
            maxLength={120}
            placeholder="Weekly vegetables"
            autoComplete="off"
            className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/50"
          />
        </label>
        <div className="mx-4 h-px bg-foreground/8" />
        <label className="flex items-center gap-3 px-4">
          <span className="w-16 shrink-0 text-[15px] text-muted-foreground">Date</span>
          <input
            id="spentAt"
            name="spentAt"
            type="date"
            defaultValue={todayISO()}
            max={todayISO()}
            className="num h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </label>
      </Inset>

      <Button type="submit" disabled={pending} className="h-14 w-full rounded-2xl text-[16px] font-semibold">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Adding…
          </>
        ) : (
          `Add expense · ${memberName}`
        )}
      </Button>
    </form>
  );
}
