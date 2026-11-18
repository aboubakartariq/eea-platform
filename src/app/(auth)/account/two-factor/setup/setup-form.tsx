"use client";

import { useActionState } from "react";
import { confirmTotpSetupAction } from "@/lib/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function SetupForm() {
  const [state, action] = useActionState(confirmTotpSetupAction, undefined);
  return (
    <form action={action} className="mt-4 space-y-4">
      <FormMessage error={state?.error} />
      <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required className="[&_input]:text-center [&_input]:font-mono [&_input]:text-xl [&_input]:tracking-[0.4em]" />
      <SubmitButton pendingText="Checking…">Turn on two-step verification</SubmitButton>
    </form>
  );
}
