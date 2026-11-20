"use client";

import Link from "next/link";
import { val, vals } from "@/lib/form-values";
import { useActionState } from "react";
import { createStaffUserAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { RoleCheckboxes } from "../role-checkboxes";
import { TempPassword } from "../temp-password";
import { useTr } from "@/i18n/app-client";

export function NewUserForm({ roles }: { roles: { id: string; name: string; description: string; key: string }[] }) {
  const { tr } = useTr();
  const [state, action] = useActionState(createStaffUserAction, undefined);
  if (state?.tempPassword) {
    return (
      <div className="space-y-5">
        <FormMessage ok={state.ok} />
        <TempPassword value={state.tempPassword} />
        <Link href="/admin/users" className="inline-block font-semibold text-navy-600 underline underline-offset-4">{tr("Back to users")}</Link>
      </div>
    );
  }
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tr("Full name")} name="name" defaultValue={val(state?.values, "name")} required error={e?.name} autoComplete="off" />
        <Field label={tr("Work email")} name="email" defaultValue={val(state?.values, "email")} type="email" required error={e?.email} autoComplete="off" />
        <Field label={tr("Phone (optional)")} name="phone" defaultValue={val(state?.values, "phone")} type="tel" error={e?.phone} autoComplete="off" />
      </div>
      <RoleCheckboxes roles={roles} selected={vals(state?.values, "roleIds")} error={e?.roleIds} />
      <SubmitButton pendingText={tr("Creating…")} className="sm:w-auto">{tr("Create account")}</SubmitButton>
    </form>
  );
}
