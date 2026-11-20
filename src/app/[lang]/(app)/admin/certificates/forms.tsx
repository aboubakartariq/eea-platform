"use client";

import { useActionState, useState } from "react";
import type { Signatory } from "@/db/schema";
import { val } from "@/lib/form-values";
import { useFormAction } from "@/lib/use-form-action";
import { revokeCertificateAction, saveTemplateAction } from "./actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function TemplateForm({ competitionId, heading, body, signatories }: { competitionId: string; heading: string; body: string; signatories: Signatory[] }) {
  const { tr } = useTr();
  const [state, action, , errorKey] = useFormAction(saveTemplateAction);
  const v = state?.values;
  const e = state?.fieldErrors ?? {};
  return (
    <form key={errorKey} action={action} className="space-y-5">
      <input type="hidden" name="competitionId" value={competitionId} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <Field label={tr("Heading")} name="heading" defaultValue={val(v, "heading", heading)} error={e.heading} />
      <TextArea label={tr("Wording")} name="body" rows={3} defaultValue={val(v, "body", body)} error={e.body} />
      <p className="-mt-3 text-xs text-muted">{tr("Placeholders: {x}", { x: "{name} {school} {award} {competition} {year} {grade}" })}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-xl bg-surface p-3">
            <Field label={tr("Signature {x}: name", { x: i + 1 })} name={`sigName${i}`} defaultValue={val(v, `sigName${i}`, signatories[i]?.name ?? "")} />
            <Field label={tr("Title")} name={`sigTitle${i}`} defaultValue={val(v, `sigTitle${i}`, signatories[i]?.title ?? "")} />
          </div>
        ))}
      </div>
      <SubmitButton pendingText={tr("Saving…")} className="sm:w-auto">{tr("Save certificate design")}</SubmitButton>
    </form>
  );
}

export function RevokeButton({ id }: { id: string }) {
  const { tr, msg } = useTr();
  const [state, action, pending] = useActionState(revokeCertificateAction, undefined);
  const [open, setOpen] = useState(false);
  if (state?.ok) return <p className="text-xs text-emerald-700">{msg(state.ok)}</p>;
  return open ? (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="reason" placeholder={tr("Reason")} aria-label={tr("Reason for revoking")} className="h-9 w-48 rounded-lg border border-line px-2 text-sm" />
      <button disabled={pending} className="text-xs font-semibold text-red-700 hover:underline">{tr("Revoke")}</button>
      {state?.error && <span className="text-xs text-red-700">{msg(state.error)}</span>}
    </form>
  ) : <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-red-700 hover:underline">{tr("Revoke…")}</button>;
}
