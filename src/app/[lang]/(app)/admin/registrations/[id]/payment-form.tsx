"use client";

import { useFormAction } from "@/lib/use-form-action";
import { val } from "@/lib/form-values";
import { recordPaymentAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

export function PaymentForm({ id, total }: { id: string; total: number }) {
  const { tr } = useTr();
  const [state, action, , errorKey] = useFormAction(recordPaymentAction);
  const v = state?.values;
  const e = state?.fieldErrors ?? {};
  return (
    <form key={errorKey} action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <FormMessage error={state?.error} />
      <div>
        <label htmlFor="f-method" className="block text-sm font-semibold text-navy-900">{tr("Paid by")}</label>
        <select id="f-method" name="method" defaultValue={val(v, "method", "bank_transfer")} className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3">
          <option value="bank_transfer">{tr("Bank transfer")}</option><option value="cash">{tr("Cash")}</option><option value="cheque">{tr("Cheque")}</option>
        </select>
        {e.method && <p className="mt-1.5 text-sm text-red-700">{e.method}</p>}
      </div>
      <Field label={tr("Reference")} name="reference" required defaultValue={val(v, "reference")} error={e.reference} hint={tr("Bank transaction ID, receipt or cheque number")} />
      <Field label={tr("Amount received (PKR)")} name="amountPkr" type="number" min={1} defaultValue={val(v, "amountPkr", String(total))} error={e.amountPkr} />
      <Field label={tr("Received on")} name="receivedOn" type="date" required defaultValue={val(v, "receivedOn")} error={e.receivedOn} />
      <SubmitButton pendingText={tr("Recording…")}>{tr("Record payment and confirm")}</SubmitButton>
    </form>
  );
}
