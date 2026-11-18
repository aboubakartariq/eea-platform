"use client";

import { useActionState } from "react";
import { resetPasswordAction, resetTwoFactorAction, setUserStatusAction, updateUserRolesAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { RoleCheckboxes } from "../role-checkboxes";
import { TempPassword } from "../temp-password";

export function UserRolesForm({ userId, roles, selected }: { userId: string; roles: { id: string; name: string; description: string; key: string }[]; selected: string[] }) {
  const [state, action] = useActionState(updateUserRolesAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <RoleCheckboxes roles={roles} selected={selected} />
      <SubmitButton pendingText="Saving…" className="sm:w-auto">Save roles</SubmitButton>
    </form>
  );
}

export function UserActions({ userId, status, hasTotp }: { userId: string; status: string; hasTotp: boolean }) {
  const [statusState, statusAction] = useActionState(setUserStatusAction, undefined);
  const [pwState, pwAction] = useActionState(resetPasswordAction, undefined);
  const [tfState, tfAction] = useActionState(resetTwoFactorAction, undefined);
  return (
    <div className="space-y-5">
      <form action={pwAction} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <FormMessage error={pwState?.error} ok={pwState?.ok} />
        {pwState?.tempPassword && <TempPassword value={pwState.tempPassword} />}
        <SubmitButton variant="outline" pendingText="Resetting…">Reset password</SubmitButton>
      </form>
      {hasTotp && (
        <form action={tfAction} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <FormMessage error={tfState?.error} ok={tfState?.ok} />
          <SubmitButton variant="outline" pendingText="Resetting…">Reset two-step verification</SubmitButton>
        </form>
      )}
      <form action={statusAction} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="status" value={status === "active" ? "disabled" : "active"} />
        <FormMessage error={statusState?.error} ok={statusState?.ok} />
        <SubmitButton variant="outline" pendingText="Saving…" className={status === "active" ? "!border-red-200 !text-red-700 hover:!bg-red-50" : ""}>
          {status === "active" ? "Disable account" : "Re-enable account"}
        </SubmitButton>
      </form>
    </div>
  );
}
