"use client";

import { useActionState } from "react";
import { bulkApproveAction, submitDraftsAction } from "./actions";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { useTr } from "@/i18n/app-client";

/** Buttons for ticked rows. Checkboxes in the table use form="bulk". */
export function BulkBar({ canManage, canApprove, hasRows }: { canManage: boolean; canApprove: boolean; hasRows: boolean }) {
  const { tr } = useTr();
  const [submitState, submit, submitting] = useActionState(submitDraftsAction, undefined);
  const [approveState, approve, approving] = useActionState(bulkApproveAction, undefined);
  const state = approveState ?? submitState;
  return (
    <form id="bulk" className="flex flex-wrap items-center gap-3">
      {hasRows && <span className="text-sm text-muted">{tr("With ticked questions:")}</span>}
      {hasRows && canManage && <button formAction={submit} disabled={submitting} className={buttonClass("outline", "sm")}>{tr("Send for review")}</button>}
      {hasRows && canApprove && <button formAction={approve} disabled={approving} className={buttonClass("primary", "sm")}>{tr("Approve")}</button>}
      <div className="w-full empty:hidden"><FormMessage error={state?.error} ok={state?.ok} /></div>
    </form>
  );
}

export function SelectAll() {
  const { tr } = useTr();
  return (
    <input
      type="checkbox"
      aria-label={tr("Tick all questions on this page")}
      className="size-4 accent-navy-600"
      onChange={(e) => document.querySelectorAll<HTMLInputElement>('input[form="bulk"][name="ids"]').forEach((c) => (c.checked = e.target.checked))}
    />
  );
}
