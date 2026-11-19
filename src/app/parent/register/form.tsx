"use client";

import { useActionState, useState } from "react";
import { registerChildrenAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { formatPKR } from "@/lib/utils";

export function RegisterChildrenForm({ competitionId, fee, kids }: { competitionId: string; fee: number; kids: { id: string; label: string; disabled: boolean; note: string }[] }) {
  const [state, action] = useActionState(registerChildrenAction, undefined);
  const [n, setN] = useState(0);
  return (
    <form action={action} className="mt-4 space-y-3" onChange={(e) => setN((e.currentTarget as HTMLFormElement).querySelectorAll("input[name=studentIds]:checked").length)}>
      <input type="hidden" name="competitionId" value={competitionId} />
      <FormMessage error={state?.error} />
      <div className="flex flex-wrap gap-2">
        {kids.map((k) => (
          <label key={k.id} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 ring-line ${k.disabled ? "text-muted" : "cursor-pointer has-[:checked]:bg-navy-600 has-[:checked]:text-white has-[:checked]:ring-navy-600"}`}>
            <input type="checkbox" name="studentIds" value={k.id} disabled={k.disabled} className="size-4 accent-gold" />
            {k.label}{k.note && <span className="text-xs">· {k.note}</span>}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <SubmitButton variant="gold" pendingText="Registering…" className="sm:w-auto">Register{n ? ` · ${formatPKR(n * fee)}` : ""}</SubmitButton>
      </div>
    </form>
  );
}
