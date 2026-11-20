"use client";

import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { linkChildAction } from "../../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function LinkChildForm() {
  const [state, action] = useActionState(linkChildAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <Field label="Student ID" name="studentCode" defaultValue={val(state?.values, "studentCode")} required placeholder="EEA-S-100245" autoCapitalize="characters" hint="Ask your child's school for it." />
      <Field label="Child's date of birth" name="dateOfBirth" defaultValue={val(state?.values, "dateOfBirth")} type="date" required />
      <Field label="Your mobile number" name="phone" defaultValue={val(state?.values, "phone")} type="tel" required placeholder="0300 1234567" hint="The number the school has on record for you." />
      <SubmitButton pendingText="Checking…" className="sm:w-auto">Link child</SubmitButton>
    </form>
  );
}
