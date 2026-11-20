"use client";

import { useActionState } from "react";
import { confirmTotpSetupAction } from "@/lib/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function SetupForm() {
  const { tr } = useTr();
  const [state, action] = useActionState(confirmTotpSetupAction, undefined);
  return (
    <form action={action} className="mt-4 space-y-4">
      <FormMessage error={state?.error} />
      <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required className="[&_input]:text-center [&_input]:font-mono [&_input]:text-xl [&_input]:tracking-[0.4em]" />
      <SubmitButton pendingText={tr("Checking…")}>{tr("Turn on two-step verification")}</SubmitButton>
    </form>
  );
}
