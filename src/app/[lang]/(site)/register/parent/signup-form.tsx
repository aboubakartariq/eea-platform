"use client";

import Link from "next/link";
import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { registerParentAction } from "./actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { LocaleField, useI18n } from "@/i18n/client";

export function ParentSignupForm() {
  const { t, href } = useI18n();
  const f = t.parentSignup.form;
  const [state, action] = useActionState(registerParentAction, undefined);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <LocaleField />
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={f.name} name="name" defaultValue={val(state?.values, "name")} required error={e.name} autoComplete="name" className="sm:col-span-2" />
        <Field label={f.email} name="email" defaultValue={val(state?.values, "email")} type="email" required error={e.email} autoComplete="email" />
        <Field label={f.mobile} name="phone" defaultValue={val(state?.values, "phone")} type="tel" required error={e.phone} autoComplete="tel" hint={f.mobileHint} />
        <Field label={f.password} name="password" type="password" required error={e.password} autoComplete="new-password" hint={f.passwordHint} />
        <Field label={f.confirm} name="confirm" type="password" required error={e.confirm} autoComplete="new-password" />
      </div>
      <div aria-hidden className="absolute -start-[9999px]"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consent" defaultChecked={val(state?.values, "consent") === "on"} className="mt-0.5 size-4 accent-navy-600" />
        <span className="text-muted">{f.consentA} <Link href={href("/terms")} className="underline">{f.terms}</Link> {f.and} <Link href={href("/privacy")} className="underline">{f.privacy}</Link>.</span>
      </label>
      {e.consent && <p className="-mt-3 text-sm text-red-700">{e.consent}</p>}
      <SubmitButton variant="gold" pendingText={f.submitting} className="sm:w-auto">{f.submit}</SubmitButton>
    </form>
  );
}
