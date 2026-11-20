"use client";

import { useActionState } from "react";
import { updateRolePermissionsAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function RolePermissionsForm({ roleId, locked, groups, selected }: { roleId: string; locked: boolean; groups: [string, { key: string; description: string }[]][]; selected: string[] }) {
  const { tr, msg } = useTr();
  const [state, action] = useActionState(updateRolePermissionsAction, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="roleId" value={roleId} />
      {locked && <FormMessage ok={tr("The Super Administrator role always has every permission and can't be changed.")} />}
      <FormMessage error={state?.error} ok={state?.ok} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map(([module, perms]) => (
          <fieldset key={module} className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <legend className="sr-only">{msg(module)}</legend>
            <p className="font-semibold text-navy-900">{msg(module)}</p>
            <div className="mt-3 space-y-2.5">
              {perms.map((p) => (
                <label key={p.key} className="flex cursor-pointer items-start gap-3 text-sm">
                  <input type="checkbox" name="permissions" value={p.key} defaultChecked={selected.includes(p.key)} disabled={locked} className="mt-0.5 size-4 accent-navy-600" />
                  <span className="text-ink">{msg(p.description)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {!locked && <SubmitButton pendingText={tr("Saving…")} className="sm:w-auto">{tr("Save permissions")}</SubmitButton>}
    </form>
  );
}
