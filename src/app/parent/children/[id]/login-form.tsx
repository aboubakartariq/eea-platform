"use client";

import { useActionState, useEffect, useRef } from "react";
import { setChildLoginAction } from "../../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function ChildLoginForm({ studentId, exists }: { studentId: string; exists: boolean }) {
  const [state, action] = useActionState(setChildLoginAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <input type="hidden" name="studentId" value={studentId} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <Field label={exists ? "New password" : "Password"} name="password" type="password" required autoComplete="new-password" error={state?.fieldErrors?.password} hint="At least 8 characters, with a number or symbol." />
      <Field label="Confirm password" name="confirm" type="password" required autoComplete="new-password" error={state?.fieldErrors?.confirm} />
      <SubmitButton pendingText="Saving…" className="sm:w-auto">{exists ? "Set new password" : "Create login"}</SubmitButton>
    </form>
  );
}
