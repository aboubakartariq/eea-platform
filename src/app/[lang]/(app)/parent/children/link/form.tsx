"use client";

import { val } from "@/lib/form-values";
import { useActionState } from "react";
import { linkChildAction } from "../../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function LinkChildForm() {
  const { tr } = useTr();
  const [state, action] = useActionState(linkChildAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <Field label={tr("Student ID")} name="studentCode" defaultValue={val(state?.values, "studentCode")} required placeholder={tr("EEA-S-100245")} autoCapitalize="characters" hint={tr("Ask your child's school for it.")} />
      <Field label={tr("Child's date of birth")} name="dateOfBirth" defaultValue={val(state?.values, "dateOfBirth")} type="date" required />
      <Field label={tr("Your mobile number")} name="phone" defaultValue={val(state?.values, "phone")} type="tel" required placeholder="0300 1234567" hint={tr("The number the school has on record for you.")} />
      <SubmitButton pendingText={tr("Checking…")} className="sm:w-auto">{tr("Link child")}</SubmitButton>
    </form>
  );
}
