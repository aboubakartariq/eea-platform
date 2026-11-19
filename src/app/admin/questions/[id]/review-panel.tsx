"use client";

import { useActionState, useState } from "react";
import { reviewQuestionAction } from "../actions";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";

type Props = { id: string; status: string; canManage: boolean; canApprove: boolean; isAuthor: boolean };

export function ReviewPanel({ id, status, canManage, canApprove, isAuthor }: Props) {
  const [state, action, pending] = useActionState(reviewQuestionAction, undefined);
  const [sendingBack, setSendingBack] = useState(false);
  const btn = (op: string, label: string, variant: "primary" | "outline" | "ghost" = "outline") => (
    <button name="op" value={op} disabled={pending} className={buttonClass(variant, "sm")}>{label}</button>
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <div className="flex flex-wrap gap-2">
        {status === "draft" && canManage && btn("submit", "Send for review", "primary")}
        {status === "review" && canApprove && !isAuthor && btn("approve", "Approve", "primary")}
        {status === "review" && canApprove && !sendingBack && <button type="button" onClick={() => setSendingBack(true)} className={buttonClass("outline", "sm")}>Send back…</button>}
        {status !== "retired" && canApprove && btn("retire", "Retire", "ghost")}
        {status === "retired" && canManage && btn("restore", "Restore as draft")}
      </div>
      {status === "review" && isAuthor && <p className="text-xs text-muted">You wrote this version, so another reviewer must approve it.</p>}
      {sendingBack && (
        <div className="space-y-2">
          <label htmlFor="note" className="block text-sm font-semibold text-navy-900">What should the author change?</label>
          <textarea id="note" name="note" rows={3} maxLength={1000} className="w-full rounded-xl border border-line px-3 py-2 text-sm" />
          {btn("send_back", "Send back with note")}
        </div>
      )}
    </form>
  );
}
