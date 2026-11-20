"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importQuestionsAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function ImportForm() {
  const { tr } = useTr();
  const [state, action] = useActionState(importQuestionsAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} ok={state?.ok} />
      {state?.ok && <p className="text-sm"><Link href="/admin/questions?status=draft" className="font-semibold text-navy-600 hover:underline">{tr("See the imported drafts →")}</Link></p>}
      {state?.rowErrors && (
        <div className="max-h-96 overflow-y-auto rounded-xl ring-1 ring-red-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-red-50 text-start text-xs uppercase text-red-800"><tr><th className="px-4 py-2">{tr("Row")}</th><th className="px-4 py-2">{tr("What to fix")}</th></tr></thead>
            <tbody className="divide-y divide-red-100">
              {state.rowErrors.map((r) => (
                <tr key={r.row}><td className="px-4 py-2 font-mono">{r.row}</td><td className="px-4 py-2">{r.errors.join(" ")}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <label htmlFor="file" className="block text-sm font-semibold text-navy-900">{tr("Excel file (.xlsx)")}</label>
        <input id="file" name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="mt-2 block w-full text-sm file:me-4 file:rounded-full file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:font-semibold file:text-navy-700" />
      </div>
      <SubmitButton pendingText={tr("Checking and importing…")} className="sm:w-auto">{tr("Check and import")}</SubmitButton>
    </form>
  );
}
