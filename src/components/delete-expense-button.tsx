"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeExpenseAction } from "@/lib/actions";

export function DeleteExpenseButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Delete ${label}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await removeExpenseAction(id);
          toast.success("Expense deleted.");
        })
      }
      className="size-11 shrink-0 text-muted-foreground hover:text-foreground md:size-7"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
