"use client";

import { useActionState } from "react";
import { sessionAction } from "../../actions";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { useTr } from "@/i18n/app-client";

export function CancelSession({ id }: { id: string }) {
  const { tr } = useTr();
  const [state, action, pending] = useActionState(sessionAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <button name="op" value="cancel" disabled={pending} className={buttonClass("ghost", "sm", "text-red-700")}>{tr("Cancel session")}</button>
    </form>
  );
}

export function EndAttempt({ id, attempt }: { id: string; attempt: string }) {
  const { tr, msg } = useTr();
  const [state, action, pending] = useActionState(sessionAction, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="attempt" value={attempt} />
      <button name="op" value="end_attempt" disabled={pending} className="text-xs font-semibold text-red-700 hover:underline">{tr("End now")}</button>
      {state?.error && <p className="text-xs text-red-700">{msg(state.error)}</p>}
    </form>
  );
}
