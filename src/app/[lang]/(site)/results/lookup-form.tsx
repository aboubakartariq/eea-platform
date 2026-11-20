"use client";

import { useActionState } from "react";
import { lookupResultAction } from "./actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { LocaleField, useI18n } from "@/i18n/client";

export function LookupForm() {
  const { t } = useI18n();
  const l = t.results.lookup;
  const [state, action] = useActionState(lookupResultAction, undefined);
  const r = state?.result;
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={action} className="space-y-4 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-line">
        <h2 className="text-xl font-bold">{l.title}</h2>
        <LocaleField />
        <FormMessage error={state?.error} />
        <Field label={l.roll} name="roll" dir="ltr" defaultValue={state?.roll ?? ""} placeholder="MMO-27-100245" required autoComplete="off" />
        <Field label={l.dob} name="dob" type="date" required />
        <SubmitButton pendingText={l.searching} className="sm:w-auto">{l.submit}</SubmitButton>
      </form>
      {r && (
        <div className="rounded-[var(--radius-card)] bg-navy-50 p-6 ring-1 ring-navy-100" role="status">
          <p className="text-sm font-semibold text-brand-blue">{r.competition} · {r.grade}</p>
          <p className="mt-1 text-2xl font-bold text-navy-900">{r.name}</p>
          {r.absent ? <p className="mt-3 text-muted">{l.absent}</p> : (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted">{l.score}</dt><dd className="text-lg font-bold">{r.score} ({r.percent})</dd></div>
              <div><dt className="text-muted">{l.rank}</dt><dd className="text-lg font-bold">{r.rank}</dd></div>
              {r.award && <div className="col-span-2"><dt className="text-muted">{l.award}</dt><dd className="text-lg font-bold text-gold-700">{r.award}</dd></div>}
            </dl>
          )}
          <p className="mt-4 text-xs text-muted">{l.portals}</p>
        </div>
      )}
    </div>
  );
}
