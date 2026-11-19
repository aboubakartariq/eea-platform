"use client";

import { useFormAction } from "@/lib/use-form-action";
import { val } from "@/lib/form-values";
import { useRef, useEffect } from "react";
import { addStudentAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

const grades = [["0", "KG"], ...Array.from({ length: 12 }, (_, i) => [String(i + 1), `Grade ${i + 1}`])];

export function NewStudentForm() {
  const [state, action, , errorKey] = useFormAction(addStudentAction);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form key={errorKey} ref={ref} action={action} className="space-y-5">
      <FormMessage error={state?.error} ok={state?.ok} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" defaultValue={val(state?.values, "firstName")} required maxLength={60} />
        <Field label="Last name" name="lastName" defaultValue={val(state?.values, "lastName")} required maxLength={60} />
        <Field label="Date of birth" name="dateOfBirth" defaultValue={val(state?.values, "dateOfBirth")} type="date" required />
        <div>
          <label htmlFor="f-grade" className="block text-sm font-semibold text-navy-900">Grade</label>
          <select id="f-grade" name="grade" required defaultValue={val(state?.values, "grade")} className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-navy-600">
            <option value="" disabled>Choose a grade</option>
            {grades.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Field label="Section (optional)" name="section" defaultValue={val(state?.values, "section")} maxLength={20} />
        <div>
          <label htmlFor="f-gender" className="block text-sm font-semibold text-navy-900">Gender (optional)</label>
          <select id="f-gender" name="gender" defaultValue={val(state?.values, "gender")} className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-navy-600">
            <option value="">Not given</option><option value="F">Female</option><option value="M">Male</option>
          </select>
        </div>
        <Field label="Parent or guardian name" name="guardianName" defaultValue={val(state?.values, "guardianName")} required maxLength={120} />
        <Field label="Parent mobile" name="guardianPhone" defaultValue={val(state?.values, "guardianPhone")} type="tel" required placeholder="0300 1234567" />
        <Field label="Parent email (optional)" name="guardianEmail" defaultValue={val(state?.values, "guardianEmail")} type="email" className="sm:col-span-2" />
      </div>
      <SubmitButton pendingText="Adding…" className="sm:w-auto">Add student</SubmitButton>
    </form>
  );
}
