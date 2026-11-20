"use client";

import { useActionState } from "react";
import { issueRollNumbersAction } from "./actions";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";

export function IssueRollNumbers() {
  const [state, action, pending] = useActionState(issueRollNumbersAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button disabled={pending} className={buttonClass("outline", "md")}>Issue missing roll numbers</button>
      <FormMessage error={state?.error} ok={state?.ok} />
    </form>
  );
}
