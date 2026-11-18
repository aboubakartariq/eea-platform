"use client";

import { useActionState, useRef, useEffect } from "react";
import { addStudentAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

const grades = [["0", "KG"], ...Array.from({ length: 12 }, (_, i) => [String(i + 1), `Grade ${i + 1}`])];

export function NewStudentForm() {
  const [state, action] = useActionState(addStudentAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-5">
      <FormMessage error={state?.error} ok={state?.ok} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" required maxLength={60} />
        <Field label="Last name" name="lastName" required maxLength={60} />
        <Field label="Date of birth" name="dateOfBirth" type="date" required />
        <div>
          <label htmlFor="f-grade" className="block text-sm font-semibold text-navy-900">Grade</label>
          <select id="f-grade" name="grade" required defaultValue="" className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-navy-600">
            <option value="" disabled>Choose a grade</option>
            {grades.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Field label="Section (optional)" name="section" maxLength={20} />
        <div>
          <label htmlFor="f-gender" className="block text-sm font-semibold text-navy-900">Gender (optional)</label>
          <select id="f-gender" name="gender" defaultValue="" className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-navy-600">
            <option value="">Not given</option><option value="F">Female</option><option value="M">Male</option>
          </select>
        </div>
        <Field label="Parent or guardian name" name="guardianName" required maxLength={120} />
        <Field label="Parent mobile" name="guardianPhone" type="tel" required placeholder="0300 1234567" />
        <Field label="Parent email (optional)" name="guardianEmail" type="email" className="sm:col-span-2" />
      </div>
      <SubmitButton pendingText="Adding…" className="sm:w-auto">Add student</SubmitButton>
    </form>
  );
}
