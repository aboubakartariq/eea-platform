"use client";

import { useActionState } from "react";
import { reviewSchoolAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function ReviewButtons({ schoolId, status }: { schoolId: string; status: string }) {
  const { tr } = useTr();
  const [state, action] = useActionState(reviewSchoolAction, undefined);
  const options =
    status === "pending" ? [["approve", tr("Approve and issue school ID"), "primary"], ["reject", tr("Reject registration"), "outline"]]
    : status === "approved" ? [["suspend", tr("Suspend school"), "outline"]]
    : [["reinstate", tr("Reinstate school"), "primary"]];
  return (
    <div className="space-y-3">
      <FormMessage error={state?.error} ok={state?.ok} />
      {options.map(([decision, label, variant]) => (
        <form key={decision} action={action}>
          <input type="hidden" name="schoolId" value={schoolId} />
          <input type="hidden" name="decision" value={decision} />
          <SubmitButton variant={variant as "primary" | "outline"} pendingText={tr("Saving…")}>{label}</SubmitButton>
        </form>
      ))}
    </div>
  );
}
