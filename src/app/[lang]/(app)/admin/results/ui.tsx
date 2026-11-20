"use client";

import { useActionState } from "react";
import { issueRollNumbersAction } from "./actions";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { useTr } from "@/i18n/app-client";

export function IssueRollNumbers() {
  const { tr } = useTr();
  const [state, action, pending] = useActionState(issueRollNumbersAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button disabled={pending} className={buttonClass("outline", "md")}>{tr("Issue missing roll numbers")}</button>
      <FormMessage error={state?.error} ok={state?.ok} />
    </form>
  );
}
