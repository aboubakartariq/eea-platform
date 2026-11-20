"use client";

import { useActionState, useEffect, useRef } from "react";
import { setChildLoginAction } from "../../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function ChildLoginForm({ studentId, exists }: { studentId: string; exists: boolean }) {
  const { tr } = useTr();
  const [state, action] = useActionState(setChildLoginAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <input type="hidden" name="studentId" value={studentId} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <Field label={exists ? tr("New password") : tr("Password")} name="password" type="password" required autoComplete="new-password" error={state?.fieldErrors?.password} hint={tr("At least 8 characters, with a number or symbol.")} />
      <Field label={tr("Confirm password")} name="confirm" type="password" required autoComplete="new-password" error={state?.fieldErrors?.confirm} />
      <SubmitButton pendingText={tr("Saving…")} className="sm:w-auto">{exists ? tr("Set new password") : tr("Create login")}</SubmitButton>
    </form>
  );
}
