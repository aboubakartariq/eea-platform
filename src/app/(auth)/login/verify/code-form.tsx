"use client";

import { useActionState } from "react";
import { verifyTotpAction } from "@/lib/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function CodeForm() {
  const [state, action] = useActionState(verifyTotpAction, undefined);
  return (
    <form action={action} className="mt-8 space-y-5">
      <FormMessage error={state?.error} />
      <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={7} required autoFocus className="[&_input]:text-center [&_input]:font-mono [&_input]:text-xl [&_input]:tracking-[0.4em]" />
      <SubmitButton pendingText="Checking…">Verify</SubmitButton>
    </form>
  );
}
