"use client";

import { useActionState, useState } from "react";
import type { AwardRule } from "@/db/schema";
import { calculateAction, resultSetAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { useTr } from "@/i18n/app-client";

const input = "h-10 rounded-xl border border-line bg-white px-3 text-sm";

type Row = { label: string; kind: string; type: string; value: string };
const toRow = (r: AwardRule): Row => ({ label: r.label, kind: r.kind, type: r.rule.type, value: r.rule.type === "rank" ? String(r.rule.max) : r.rule.type === "all" ? "" : String(r.rule.value) });

export function CalculateForm({ competitionId, rules, recalc }: { competitionId: string; rules: AwardRule[]; recalc: boolean }) {
  const { tr } = useTr();
  const [state, action] = useActionState(calculateAction, undefined);
  // Controlled, so a failed calculation keeps the awards as edited.
  const [rows, setRows] = useState<Row[]>(rules.length ? rules.map(toRow) : [{ label: "", kind: "merit", type: "rank", value: "" }]);
  const set = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="competitionId" value={competitionId} />
      <FormMessage error={state?.error} ok={state?.ok} />
      <div>
        <p className="text-sm font-semibold text-navy-900">{tr("Awards, checked from top to bottom; each student gets the first one that fits")}</p>
        <div className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input name={`awLabel${i}`} value={r.label} onChange={(e) => set(i, "label", e.target.value)} placeholder={tr("Award name")} aria-label={tr("Award {x} name", { x: i + 1 })} className={`${input} w-56`} />
              <select name={`awKind${i}`} value={r.kind} onChange={(e) => set(i, "kind", e.target.value)} aria-label={tr("Award {x} kind", { x: i + 1 })} className={input}>
                <option value="medal">{tr("Medal (sent by post)")}</option><option value="merit">{tr("Certificate of merit")}</option><option value="participation">{tr("Participation")}</option>
              </select>
              <select name={`awType${i}`} value={r.type} onChange={(e) => set(i, "type", e.target.value)} aria-label={tr("Award {x} rule", { x: i + 1 })} className={input}>
                <option value="rank">{tr("Rank in grade up to")}</option><option value="top_percent">{tr("Top % of grade")}</option><option value="min_percent">{tr("Score at least %")}</option><option value="all">{tr("Everyone who sat")}</option>
              </select>
              {r.type !== "all" && <input name={`awValue${i}`} type="number" min={1} max={1000} value={r.value} onChange={(e) => set(i, "value", e.target.value)} aria-label={tr("Award {x} value", { x: i + 1 })} className={`${input} w-24`} />}
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={tr("Remove award {x}", { x: i + 1 })} className="text-sm text-muted hover:text-red-700">{tr("Remove")}</button>
            </div>
          ))}
        </div>
        {rows.length < 8 && <button type="button" onClick={() => setRows([...rows, { label: "", kind: "merit", type: "rank", value: "" }])} className="mt-2 text-sm font-semibold text-navy-600 hover:underline">{tr("+ Add award")}</button>}
      </div>
      <SubmitButton pendingText={tr("Calculating…")} className="sm:w-auto">{recalc ? tr("Recalculate results") : tr("Calculate results")}</SubmitButton>
    </form>
  );
}

export function SetActions({ setId, status, canApprove, canPublish, isCalculator }: { setId: string; status: string; canApprove: boolean; canPublish: boolean; isCalculator: boolean }) {
  const { tr } = useTr();
  const [state, action, pending] = useActionState(resultSetAction, undefined);
  const [when, setWhen] = useState("now");
  const [withdrawing, setWithdrawing] = useState(false);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="setId" value={setId} />
      <FormMessage error={state?.error} ok={state?.ok} />
      {status === "draft" && canApprove && (isCalculator
        ? <p className="text-sm text-muted">{tr("You calculated these results, so another person with approval rights must approve them.")}</p>
        : <button name="op" value="approve" disabled={pending} className={buttonClass("primary", "sm")}>{tr("Approve results")}</button>)}
      {status === "approved" && canPublish && (
        <div className="flex flex-wrap items-center gap-3">
          <select name="when" value={when} onChange={(e) => setWhen(e.target.value)} aria-label={tr("When to publish")} className={input}>
            <option value="now">{tr("Publish now")}</option><option value="later">{tr("Publish at a set time")}</option>
          </select>
          {when === "later" && <input type="datetime-local" name="publishAt" aria-label={tr("Publish at (Pakistan time)")} className={input} />}
          <button name="op" value="publish" disabled={pending} className={buttonClass("gold", "sm")}>{when === "later" ? tr("Schedule") : tr("Publish")}</button>
        </div>
      )}
      {(status === "approved" || status === "published") && canPublish && (
        withdrawing ? (
          <div className="space-y-2">
            <label htmlFor="reason" className="block text-sm font-semibold text-navy-900">{tr("Why are the results being withdrawn?")}</label>
            <textarea id="reason" name="reason" rows={2} maxLength={500} className="w-full rounded-xl border border-line px-3 py-2 text-sm" />
            <button name="op" value="withdraw" disabled={pending} className={buttonClass("outline", "sm", "text-red-700")}>{tr("Withdraw results")}</button>
          </div>
        ) : <button type="button" onClick={() => setWithdrawing(true)} className="text-sm font-semibold text-red-700 hover:underline">{tr("Withdraw for correction…")}</button>
      )}
    </form>
  );
}
