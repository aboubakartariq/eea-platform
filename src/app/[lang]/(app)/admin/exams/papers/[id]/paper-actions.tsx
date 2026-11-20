"use client";

import { useActionState } from "react";
import { paperAction } from "../../actions";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { useTr } from "@/i18n/app-client";

export function PaperActions({ id, status, hasSessions }: { id: string; status: string; hasSessions: boolean }) {
  const { tr } = useTr();
  const [state, action, pending] = useActionState(paperAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <div className="flex flex-wrap gap-2">
        {status === "draft" ? (
          <>
            <button name="op" value="finalise" disabled={pending} className={buttonClass("primary", "sm")}>{tr("Make final")}</button>
            <button name="op" value="regenerate" disabled={pending} className={buttonClass("outline", "sm")}>{tr("Pick a new set")}</button>
            <button name="op" value="delete" disabled={pending} className={buttonClass("ghost", "sm", "text-red-700")}>{tr("Delete draft")}</button>
          </>
        ) : !hasSessions ? (
          <button name="op" value="reopen" disabled={pending} className={buttonClass("outline", "sm")}>{tr("Reopen as draft")}</button>
        ) : null}
      </div>
    </form>
  );
}

export function SwapButton({ paperId, pq }: { paperId: string; pq: string }) {
  const { tr, msg } = useTr();
  const [state, action, pending] = useActionState(paperAction, undefined);
  return (
    <form action={action} className="text-end">
      <input type="hidden" name="id" value={paperId} />
      <input type="hidden" name="pq" value={pq} />
      <button name="op" value="swap" disabled={pending} className="text-xs font-semibold text-navy-600 hover:underline disabled:opacity-50">{pending ? tr("Swapping…") : tr("Swap")}</button>
      {state?.error && <p className="mt-1 max-w-48 text-xs text-red-700">{msg(state.error)}</p>}
    </form>
  );
}
