"use client";

import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitContactAction } from "./actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";

const audiences = [
  { value: "parent", label: "Parent" },
  { value: "school", label: "School" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const [state, action] = useActionState(submitContactAction, undefined);
  if (state?.ok) {
    return (
      <div className="rounded-[var(--radius-card)] bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">Thank you, your message has been sent</h2>
        <p className="mt-2 text-muted">Our team will reply to the email address you gave us.</p>
      </div>
    );
  }
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" defaultValue={val(state?.values, "name")} autoComplete="name" required maxLength={120} error={e?.name} />
        <Field label="Email" name="email" defaultValue={val(state?.values, "email")} type="email" autoComplete="email" required error={e?.email} />
        <Field label="Phone (optional)" name="phone" defaultValue={val(state?.values, "phone")} type="tel" autoComplete="tel" error={e?.phone} />
        <fieldset>
          <legend className="text-sm font-semibold text-navy-900">I am a</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {audiences.map((a) => (
              <label key={a.value} className="cursor-pointer rounded-full px-4 py-2.5 text-sm ring-1 ring-line has-[:checked]:bg-navy-600 has-[:checked]:text-white has-[:checked]:ring-navy-600">
                <input type="radio" name="audience" value={a.value} defaultChecked={val(state?.values, "audience") === a.value} className="sr-only" required />
                {a.label}
              </label>
            ))}
          </div>
          {e?.audience && <p className="mt-1.5 text-sm text-red-700">{e.audience}</p>}
        </fieldset>
      </div>
      <Field label="Subject" name="subject" defaultValue={val(state?.values, "subject")} required maxLength={160} error={e?.subject} />
      <TextArea label="Message" name="message" required maxLength={4000} error={e?.message} rows={6} defaultValue={val(state?.values, "message")} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <p className="text-xs text-muted">We use your details only to reply to this message. See our <a href="/privacy" className="underline">privacy policy</a>.</p>
      <SubmitButton variant="gold" pendingText="Sending…" className="sm:w-auto">Send message</SubmitButton>
    </form>
  );
}
