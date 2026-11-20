"use client";

import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitContactAction } from "./actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { LocaleField, useI18n } from "@/i18n/client";

const audiences = ["parent", "school", "student", "other"] as const;

export function ContactForm() {
  const { t, href } = useI18n();
  const f = t.contact.form;
  const [state, action] = useActionState(submitContactAction, undefined);
  if (state?.ok) {
    return (
      <div className="rounded-[var(--radius-card)] bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">{f.sentTitle}</h2>
        <p className="mt-2 text-muted">{f.sent}</p>
      </div>
    );
  }
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-5" noValidate>
      <LocaleField />
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={f.name} name="name" defaultValue={val(state?.values, "name")} autoComplete="name" required maxLength={120} error={e?.name} />
        <Field label={f.email} name="email" defaultValue={val(state?.values, "email")} type="email" autoComplete="email" required error={e?.email} />
        <Field label={f.phone} name="phone" defaultValue={val(state?.values, "phone")} type="tel" autoComplete="tel" error={e?.phone} />
        <fieldset>
          <legend className="text-sm font-semibold text-navy-900">{f.iAm}</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {audiences.map((a) => (
              <label key={a} className="cursor-pointer rounded-full px-4 py-2.5 text-sm ring-1 ring-line has-[:checked]:bg-navy-600 has-[:checked]:text-white has-[:checked]:ring-navy-600">
                <input type="radio" name="audience" value={a} defaultChecked={val(state?.values, "audience") === a} className="sr-only" required />
                {f.audiences[a]}
              </label>
            ))}
          </div>
          {e?.audience && <p className="mt-1.5 text-sm text-red-700">{e.audience}</p>}
        </fieldset>
      </div>
      <Field label={f.subject} name="subject" defaultValue={val(state?.values, "subject")} required maxLength={160} error={e?.subject} />
      <TextArea label={f.message} name="message" required maxLength={4000} error={e?.message} rows={6} defaultValue={val(state?.values, "message")} />
      <div aria-hidden className="absolute -start-[9999px]">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <p className="text-xs text-muted">{f.privacy} <a href={href("/privacy")} className="underline">{f.privacyLink}</a>.</p>
      <SubmitButton variant="gold" pendingText={f.sending} className="sm:w-auto">{f.send}</SubmitButton>
    </form>
  );
}
