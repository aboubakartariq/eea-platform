"use client";

import Link from "next/link";
import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { registerSchoolAction } from "./actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { LocaleField, useI18n } from "@/i18n/client";

export function SchoolSignupForm() {
  const { t, href } = useI18n();
  const f = t.schoolSignup.form;
  const [state, action] = useActionState(registerSchoolAction, undefined);
  if (state?.ok) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">{f.doneTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{f.done}</p>
        <Link href={href("/")} className="mt-6 inline-block font-semibold text-navy-600 underline underline-offset-4">{f.backHome}</Link>
      </div>
    );
  }
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-8" noValidate>
      <LocaleField />
      <FormMessage error={state?.error} />
      <fieldset className="space-y-5">
        <legend className="text-lg font-bold text-navy-900">{f.school}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.schoolName} name="schoolName" defaultValue={val(state?.values, "schoolName")} required error={e.schoolName} className="sm:col-span-2" />
          <Field label={f.principal} name="principalName" defaultValue={val(state?.values, "principalName")} required error={e.principalName} />
          <Field label={f.officialEmail} name="officialEmail" defaultValue={val(state?.values, "officialEmail")} type="email" required error={e.officialEmail} />
          <Field label={f.schoolPhone} name="schoolPhone" defaultValue={val(state?.values, "schoolPhone")} type="tel" required error={e.schoolPhone} />
          <Field label={f.city} name="city" defaultValue={val(state?.values, "city")} required error={e.city} autoComplete="address-level2" />
          <Field label={f.address} name="address" defaultValue={val(state?.values, "address")} required error={e.address} className="sm:col-span-2" autoComplete="street-address" />
        </div>
      </fieldset>
      <fieldset className="space-y-5">
        <legend className="text-lg font-bold text-navy-900">{f.coordinator}</legend>
        <p className="text-sm text-muted">{f.coordinatorHint}</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.fullName} name="coordinatorName" defaultValue={val(state?.values, "coordinatorName")} required error={e.coordinatorName} autoComplete="name" />
          <Field label={f.mobile} name="coordinatorPhone" defaultValue={val(state?.values, "coordinatorPhone")} type="tel" required error={e.coordinatorPhone} autoComplete="tel" />
          <Field label={f.emailSignIn} name="coordinatorEmail" defaultValue={val(state?.values, "coordinatorEmail")} type="email" required error={e.coordinatorEmail} autoComplete="email" className="sm:col-span-2" />
          <Field label={f.password} name="password" type="password" required error={e.password} autoComplete="new-password" hint={f.passwordHint} />
          <Field label={f.confirm} name="confirm" type="password" required error={e.confirm} autoComplete="new-password" />
        </div>
      </fieldset>
      <div aria-hidden className="absolute -start-[9999px]"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consent" defaultChecked={val(state?.values, "consent") === "on"} className="mt-0.5 size-4 accent-navy-600" />
        <span className="text-muted">{f.consentA} <Link href={href("/terms")} className="underline">{f.terms}</Link> {f.and} <Link href={href("/privacy")} className="underline">{f.privacy}</Link>.</span>
      </label>
      {e.consent && <p className="-mt-6 text-sm text-red-700">{e.consent}</p>}
      <SubmitButton variant="gold" pendingText={f.submitting} className="sm:w-auto">{f.submit}</SubmitButton>
    </form>
  );
}
