"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addMemberAction, type ActionState } from "@/lib/actions";

const INITIAL: ActionState = { ok: false, message: "" };

export function AddMemberForm({
  signIn = false,
  submitLabel = "Add member",
}: {
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
    <form ref={formRef} action={formAction} className="space-y-3">
      {signIn ? <input type="hidden" name="signIn" value="1" /> : null}
      <input
        id="member-name"
        name="name"
        placeholder="Name"
        required
        maxLength={40}
        autoComplete="off"
        className="h-12 w-full rounded-2xl bg-muted px-4 text-[15px] outline-none placeholder:text-muted-foreground/60"
      />
      <input
        id="member-role"
        name="role"
        placeholder="Role · optional"
        maxLength={24}
        autoComplete="off"
        className="h-12 w-full rounded-2xl bg-muted px-4 text-[15px] outline-none placeholder:text-muted-foreground/60"
      />
      <Button type="submit" disabled={pending} className="h-12 w-full rounded-2xl text-[15px] font-semibold">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {submitLabel}
      </Button>
    </form>
  );
}
