"use client";

import { useFormAction } from "@/lib/use-form-action";
import { val } from "@/lib/form-values";
import { createSessionAction } from "../../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function SessionForm({ papers, paper }: { papers: { id: string; label: string }[]; paper?: string }) {
  const [state, action, , errorKey] = useFormAction(createSessionAction);
  const v = state?.values;
  const e = state?.fieldErrors ?? {};
  return (
    <form key={errorKey} action={action} className="max-w-2xl space-y-5 rounded-2xl bg-white p-6 ring-1 ring-line">
      <FormMessage error={state?.error} />
      <div>
        <label htmlFor="f-paperId" className="block text-sm font-semibold text-navy-900">Paper</label>
        <select id="f-paperId" name="paperId" defaultValue={val(v, "paperId", paper ?? "")} className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px]">
          <option value="">Choose a final paper…</option>
          {papers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {e.paperId && <p className="mt-1.5 text-sm text-red-700">{e.paperId}</p>}
      </div>
      <Field label="Session title" name="title" required defaultValue={val(v, "title")} error={e.title} hint="Students see this, e.g. Main exam — Saturday morning" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Opens (Pakistan time)" name="opensAt" type="datetime-local" required defaultValue={val(v, "opensAt")} error={e.opensAt} />
        <Field label="Closes (Pakistan time)" name="closesAt" type="datetime-local" required defaultValue={val(v, "closesAt")} error={e.closesAt} />
      </div>
      <SubmitButton pendingText="Scheduling…" className="sm:w-auto">Schedule session</SubmitButton>
    </form>
  );
}
