"use client";

import Link from "next/link";
import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { registerParentAction } from "./actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function ParentSignupForm() {
  const [state, action] = useActionState(registerParentAction, undefined);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your full name" name="name" defaultValue={val(state?.values, "name")} required error={e.name} autoComplete="name" className="sm:col-span-2" />
        <Field label="Email (used to sign in)" name="email" defaultValue={val(state?.values, "email")} type="email" required error={e.email} autoComplete="email" />
        <Field label="Mobile number" name="phone" defaultValue={val(state?.values, "phone")} type="tel" required error={e.phone} autoComplete="tel" hint="The number your child's school has on record." />
        <Field label="Password" name="password" type="password" required error={e.password} autoComplete="new-password" hint="At least 10 characters, mixing letters with numbers or symbols." />
        <Field label="Confirm password" name="confirm" type="password" required error={e.confirm} autoComplete="new-password" />
      </div>
      <div aria-hidden className="absolute -left-[9999px]"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consent" defaultChecked={val(state?.values, "consent") === "on"} className="mt-0.5 size-4 accent-navy-600" />
        <span className="text-muted">I am the parent or legal guardian of the children I add, and I consent to EEA processing their details to run competitions. I agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</span>
      </label>
      {e.consent && <p className="-mt-3 text-sm text-red-700">{e.consent}</p>}
      <SubmitButton variant="gold" pendingText="Creating account…" className="sm:w-auto">Create account</SubmitButton>
    </form>
  );
}
