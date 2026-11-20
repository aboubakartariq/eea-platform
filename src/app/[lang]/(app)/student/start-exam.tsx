"use client";

import { useActionState } from "react";
import { startExamAction } from "./exam-actions";
import { SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function StartExam({ session, label }: { session: string; label: string }) {
  const { tr, msg } = useTr();
  const [state, action] = useActionState(startExamAction, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="session" value={session} />
      <SubmitButton pendingText={tr("Opening…")} variant="gold" className="sm:w-auto">{label}</SubmitButton>
      {state?.error && <p role="alert" className="mt-2 text-sm text-red-700">{msg(state.error)}</p>}
    </form>
  );
}
