"use client";

import { useActionState, useState } from "react";
import { updateDispatchAction } from "./actions";
import { buttonClass } from "@/components/ui/button";

const input = "h-9 rounded-lg border border-line bg-white px-2 text-sm";

export function DispatchForm({ d }: { d: { id: string; status: string; address: string; courier: string; tracking: string } }) {
  const [state, action, pending] = useActionState(updateDispatchAction, undefined);
  // Controlled, so React's reset after an error doesn't undo what was typed or chosen.
  const [f, setF] = useState({ address: d.address, courier: d.courier, tracking: d.tracking, status: d.status });
  const bind = (k: keyof typeof f) => ({ name: k, value: f[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={d.id} />
      <input {...bind("address")} placeholder="Delivery address" aria-label="Delivery address" className={`${input} w-64`} />
      <input {...bind("courier")} placeholder="Courier" aria-label="Courier" className={`${input} w-28`} />
      <input {...bind("tracking")} placeholder="Tracking no." aria-label="Tracking number" className={`${input} w-32`} />
      <select {...bind("status")} aria-label="Status" className={input}>
        <option value="pending">Pending</option><option value="packed">Packed</option><option value="dispatched">Dispatched</option><option value="delivered">Delivered</option>
      </select>
      <button disabled={pending} className={buttonClass("outline", "sm")}>Save</button>
      {state?.error && <span className="w-full text-xs text-red-700">{state.error}</span>}
      {state?.ok && <span className="text-xs text-emerald-700">{state.ok}</span>}
    </form>
  );
}
