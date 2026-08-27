"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMemberAction, type ActionState } from "@/lib/actions";

const INITIAL: ActionState = { ok: false, message: "" };

export function AddMemberForm({
  signIn = false,
  submitLabel = "Add member",
}: {
  /** On the sign-in screen, creating a person also signs them in. */
  signIn?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(addMemberAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      {signIn ? <input type="hidden" name="signIn" value="1" /> : null}
      <div className="space-y-2">
        <Label htmlFor="member-name">Name</Label>
        <Input id="member-name" name="name" placeholder="Anjali" required maxLength={40} autoComplete="off" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="member-role">
          Role <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="member-role" name="role" placeholder="Amma" maxLength={24} autoComplete="off" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {submitLabel}
      </Button>
    </form>
  );
}
