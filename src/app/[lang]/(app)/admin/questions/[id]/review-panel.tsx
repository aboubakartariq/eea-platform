"use client";

import { useActionState, useState } from "react";
import { reviewQuestionAction } from "../actions";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { useTr } from "@/i18n/app-client";

type Props = { id: string; status: string; canManage: boolean; canApprove: boolean; isAuthor: boolean };

export function ReviewPanel({ id, status, canManage, canApprove, isAuthor }: Props) {
  const { tr } = useTr();
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
        {status === "draft" && canManage && btn("submit", tr("Send for review"), "primary")}
        {status === "review" && canApprove && !isAuthor && btn("approve", tr("Approve"), "primary")}
        {status === "review" && canApprove && !sendingBack && <button type="button" onClick={() => setSendingBack(true)} className={buttonClass("outline", "sm")}>{tr("Send back…")}</button>}
        {status !== "retired" && canApprove && btn("retire", tr("Retire"), "ghost")}
        {status === "retired" && canManage && btn("restore", tr("Restore as draft"))}
      </div>
      {status === "review" && isAuthor && <p className="text-xs text-muted">{tr("You wrote this version, so another reviewer must approve it.")}</p>}
      {sendingBack && (
        <div className="space-y-2">
          <label htmlFor="note" className="block text-sm font-semibold text-navy-900">{tr("What should the author change?")}</label>
          <textarea id="note" name="note" rows={3} maxLength={1000} className="w-full rounded-xl border border-line px-3 py-2 text-sm" />
          {btn("send_back", tr("Send back with note"))}
        </div>
      )}
    </form>
  );
}
