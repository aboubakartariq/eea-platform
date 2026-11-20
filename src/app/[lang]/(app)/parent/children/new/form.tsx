"use client";

import { useFormAction } from "@/lib/use-form-action";
import { val } from "@/lib/form-values";
import { addChildAction } from "../../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

const grades = [["0", "KG"], ...Array.from({ length: 12 }, (_, i) => [String(i + 1), `Grade ${i + 1}`])];
const select = "mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-navy-600";

export function AddChildForm() {
  const { tr } = useTr();
  const [state, action, , errorKey] = useFormAction(addChildAction);
  return (
    <form key={errorKey} action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tr("First name")} name="firstName" defaultValue={val(state?.values, "firstName")} required maxLength={60} />
        <Field label={tr("Last name")} name="lastName" defaultValue={val(state?.values, "lastName")} required maxLength={60} />
        <Field label={tr("Date of birth")} name="dateOfBirth" defaultValue={val(state?.values, "dateOfBirth")} type="date" required />
        <div>
          <label htmlFor="f-grade" className="block text-sm font-semibold text-navy-900">{tr("Current grade")}</label>
          <select id="f-grade" name="grade" required defaultValue={val(state?.values, "grade")} className={select}>
            <option value="" disabled>{tr("Choose a grade")}</option>
            {grades.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-gender" className="block text-sm font-semibold text-navy-900">{tr("Gender (optional)")}</label>
          <select id="f-gender" name="gender" defaultValue={val(state?.values, "gender")} className={select}><option value="">{tr("Not given")}</option><option value="F">{tr("Female")}</option><option value="M">{tr("Male")}</option></select>
        </div>
        <Field label={tr("School name (optional)")} name="schoolName" defaultValue={val(state?.values, "schoolName")} maxLength={200} />
      </div>
      <SubmitButton pendingText={tr("Adding…")} className="sm:w-auto">{tr("Add child")}</SubmitButton>
    </form>
  );
}
