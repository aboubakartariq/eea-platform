"use client";

import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <FormMessage error={state?.error} />
      <Field label="Email or student ID" name="email" type="text" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="username" defaultValue={val(state?.values, "email")} required error={state?.fieldErrors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required error={state?.fieldErrors?.password} />
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
