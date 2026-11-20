"use client";

import { useActionState } from "react";
import { importSheetsAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function SheetUpload({ paperId }: { paperId: string }) {
  const { tr } = useTr();
  const [state, action] = useActionState(importSheetsAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="paperId" value={paperId} />
      <FormMessage error={state?.error} ok={state?.ok} />
      {state?.rowErrors && (
        <div className="max-h-72 overflow-y-auto rounded-xl ring-1 ring-red-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-red-50 text-start text-xs uppercase text-red-800"><tr><th className="px-4 py-2">{tr("Row")}</th><th className="px-4 py-2">{tr("What to fix")}</th></tr></thead>
            <tbody className="divide-y divide-red-100">{state.rowErrors.map((r) => <tr key={r.row}><td className="px-4 py-2 font-mono">{r.row}</td><td className="px-4 py-2">{r.errors.join(" ")}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input name="file" type="file" accept=".xlsx" required aria-label={tr("Filled-in answer sheet")} className="text-sm file:me-3 file:rounded-full file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:font-semibold file:text-navy-700" />
        <SubmitButton pendingText={tr("Marking…")} variant="primary" className="sm:w-auto">{tr("Upload and mark")}</SubmitButton>
      </div>
    </form>
  );
}
