"use client";

import Link from "next/link";
import { val, vals } from "@/lib/form-values";
import { useActionState } from "react";
import { createStaffUserAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { RoleCheckboxes } from "../role-checkboxes";
import { TempPassword } from "../temp-password";

export function NewUserForm({ roles }: { roles: { id: string; name: string; description: string; key: string }[] }) {
  const [state, action] = useActionState(createStaffUserAction, undefined);
  if (state?.tempPassword) {
    return (
      <div className="space-y-5">
        <FormMessage ok={state.ok} />
        <TempPassword value={state.tempPassword} />
        <Link href="/admin/users" className="inline-block font-semibold text-navy-600 underline underline-offset-4">Back to users</Link>
      </div>
    );
  }
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" defaultValue={val(state?.values, "name")} required error={e?.name} autoComplete="off" />
        <Field label="Work email" name="email" defaultValue={val(state?.values, "email")} type="email" required error={e?.email} autoComplete="off" />
        <Field label="Phone (optional)" name="phone" defaultValue={val(state?.values, "phone")} type="tel" error={e?.phone} autoComplete="off" />
      </div>
      <RoleCheckboxes roles={roles} selected={vals(state?.values, "roleIds")} error={e?.roleIds} />
      <SubmitButton pendingText="Creating…" className="sm:w-auto">Create account</SubmitButton>
    </form>
  );
}
