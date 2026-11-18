"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { registerSchoolAction } from "./actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function SchoolSignupForm() {
  const [state, action] = useActionState(registerSchoolAction, undefined);
  if (state?.ok) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">Registration received</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">Thank you. Our team will verify your school and approve the account. You can sign in with the coordinator email and password once it is approved.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-navy-600 underline underline-offset-4">Back to the homepage</Link>
      </div>
    );
  }
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-8" noValidate>
      <FormMessage error={state?.error} />
      <fieldset className="space-y-5">
        <legend className="text-lg font-bold text-navy-900">School</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="School name" name="schoolName" required error={e.schoolName} className="sm:col-span-2" />
          <Field label="Principal's name" name="principalName" required error={e.principalName} />
          <Field label="Official email" name="officialEmail" type="email" required error={e.officialEmail} />
          <Field label="School phone" name="schoolPhone" type="tel" required error={e.schoolPhone} />
          <Field label="City" name="city" required error={e.city} autoComplete="address-level2" />
          <Field label="Address" name="address" required error={e.address} className="sm:col-span-2" autoComplete="street-address" />
        </div>
      </fieldset>
      <fieldset className="space-y-5">
        <legend className="text-lg font-bold text-navy-900">Competition coordinator</legend>
        <p className="text-sm text-muted">The coordinator manages students, registrations and results for the school. You can add more staff later.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" name="coordinatorName" required error={e.coordinatorName} autoComplete="name" />
          <Field label="Mobile number" name="coordinatorPhone" type="tel" required error={e.coordinatorPhone} autoComplete="tel" />
          <Field label="Email (used to sign in)" name="coordinatorEmail" type="email" required error={e.coordinatorEmail} autoComplete="email" className="sm:col-span-2" />
          <Field label="Password" name="password" type="password" required error={e.password} autoComplete="new-password" hint="At least 10 characters, mixing letters with numbers or symbols." />
          <Field label="Confirm password" name="confirm" type="password" required error={e.confirm} autoComplete="new-password" />
        </div>
      </fieldset>
      <div aria-hidden className="absolute -left-[9999px]"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-navy-600" />
        <span className="text-muted">I am authorised by the school to register it, and the school will obtain parents&apos; consent before adding students. I agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</span>
      </label>
      {e.consent && <p className="-mt-6 text-sm text-red-700">{e.consent}</p>}
      <SubmitButton variant="gold" pendingText="Submitting…" className="sm:w-auto">Submit registration</SubmitButton>
    </form>
  );
}
