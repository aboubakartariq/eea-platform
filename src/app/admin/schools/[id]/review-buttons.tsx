"use client";

import { useActionState } from "react";
import { reviewSchoolAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function ReviewButtons({ schoolId, status }: { schoolId: string; status: string }) {
  const [state, action] = useActionState(reviewSchoolAction, undefined);
  const options =
    status === "pending" ? [["approve", "Approve and issue school ID", "primary"], ["reject", "Reject registration", "outline"]]
    : status === "approved" ? [["suspend", "Suspend school", "outline"]]
    : [["reinstate", "Reinstate school", "primary"]];
  return (
    <div className="space-y-3">
      <FormMessage error={state?.error} ok={state?.ok} />
      {options.map(([decision, label, variant]) => (
        <form key={decision} action={action}>
          <input type="hidden" name="schoolId" value={schoolId} />
          <input type="hidden" name="decision" value={decision} />
          <SubmitButton variant={variant as "primary" | "outline"} pendingText="Saving…">{label}</SubmitButton>
        </form>
      ))}
    </div>
  );
}
