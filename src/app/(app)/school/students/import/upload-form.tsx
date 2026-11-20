"use client";

import { useActionState } from "react";
import { uploadStudentFileAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function UploadForm() {
  const [state, action] = useActionState(uploadStudentFileAction, undefined);
  return (
    <form action={action} className="mt-5 space-y-4">
      <FormMessage error={state?.error} />
      <label htmlFor="file" className="block cursor-pointer rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/40 p-6 text-center hover:border-navy-600">
        <span className="block text-sm font-semibold text-navy-900">Choose an Excel file (.xlsx)</span>
        <span className="mt-1 block text-xs text-muted">Up to 2,000 students and 2 MB per file</span>
        <input id="file" name="file" type="file" required accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="mx-auto mt-4 block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-navy-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
      </label>
      <SubmitButton pendingText="Checking the file…" className="sm:w-auto">Upload and check</SubmitButton>
    </form>
  );
}
