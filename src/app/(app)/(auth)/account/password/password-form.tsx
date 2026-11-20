"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const e = state?.fieldErrors;
  return (
    <form action={action} className="mt-8 space-y-5">
      <FormMessage error={state?.error} />
      <Field label="Current or temporary password" name="current" type="password" autoComplete="current-password" required error={e?.current} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" required error={e?.password} hint="At least 10 characters, mixing letters with numbers or symbols." />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={e?.confirm} />
      <SubmitButton pendingText="Saving…">Save password</SubmitButton>
    </form>
  );
}
