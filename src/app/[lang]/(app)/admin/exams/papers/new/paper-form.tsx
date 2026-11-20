"use client";

import { useFormAction } from "@/lib/use-form-action";
import { useState } from "react";
import { val } from "@/lib/form-values";
import { BLUEPRINT_ROWS } from "@/lib/question-ui";
import { createPaperAction } from "../../actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

type Scope = { competitionId: string; competitionName: string; gradeFrom: number; gradeTo: number; level: number };

export function PaperForm({ scope, topics, defaultDuration }: { scope: Scope; topics: string[]; defaultDuration: number }) {
  const { tr } = useTr();
  const [state, action, , errorKey] = useFormAction(createPaperAction);
  const v = state?.values;
  const e = state?.fieldErrors ?? {};
  const filled = v ? Array.from({ length: BLUEPRINT_ROWS }, (_, i) => val(v, `bpCount${i}`)).filter(Boolean).length : 0;
  const [rows, setRows] = useState(Math.max(filled, Math.min(Math.max(topics.length, 1), 4)));
  const input = "h-11 rounded-xl border border-line bg-white px-3 text-sm";
  return (
    <form key={errorKey} action={action} className="space-y-6">
      <input type="hidden" name="competitionId" value={scope.competitionId} />
      <input type="hidden" name="gradeFrom" value={scope.gradeFrom} />
      <input type="hidden" name="gradeTo" value={scope.gradeTo} />
      <input type="hidden" name="level" value={scope.level} />
      <FormMessage error={state?.error} />
      <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="text-base font-semibold">{tr("Paper")}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={tr("Title")} name="title" className="sm:col-span-2" required defaultValue={val(v, "title", `${scope.competitionName} ${new Date().getFullYear()}`)} error={e.title} />
          <Field label={tr("Time allowed (minutes)")} name="durationMinutes" type="number" min={5} max={300} defaultValue={val(v, "durationMinutes", String(defaultDuration))} error={e.durationMinutes} />
          <Field label={tr("Negative marking (%)")} name="negativePercent" type="number" min={0} max={100} defaultValue={val(v, "negativePercent", "0")} error={e.negativePercent} hint={tr("Taken off for a wrong answer. 0 = none.")} />
        </div>
        <div className="mt-5 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="shuffleQuestions" defaultChecked={v ? val(v, "shuffleQuestions") === "on" : true} className="size-4 accent-navy-600" />{" "}{tr("Different question order for each online student")}</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="shuffleOptions" defaultChecked={v ? val(v, "shuffleOptions") === "on" : true} className="size-4 accent-navy-600" />{" "}{tr("Shuffle answer options online")}</label>
          <label className="flex items-center gap-2">{tr("Printed versions")}
            <select name="printSets" defaultValue={val(v, "printSets", "2")} className={input}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 1 ? "1 (A)" : `${n} (A–${String.fromCharCode(64 + n)})`}</option>)}</select>
          </label>
        </div>
        <div className="mt-5"><TextArea label={tr("Instructions for students (optional)")} name="instructions" rows={3} defaultValue={val(v, "instructions")} /></div>
      </section>

      <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="text-base font-semibold">{tr("Blueprint")}</h2>
        <p className="mt-1 text-sm text-muted">{tr("How many questions of each kind. Leave topic or difficulty as “Any” to mix. Questions are picked at random from the approved bank.")}</p>
        <datalist id="topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
        <div className="mt-5 space-y-2.5">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3">
              <span className="w-6 text-sm text-muted">{i + 1}.</span>
              <input name={`bpCount${i}`} type="number" min={1} max={200} placeholder={tr("Count")} aria-label={tr("Row {x} number of questions", { x: i + 1 })} defaultValue={val(v, `bpCount${i}`)} className={`${input} w-24`} />
              <input name={`bpTopic${i}`} list="topics" placeholder={tr("Any topic")} aria-label={tr("Row {x} topic", { x: i + 1 })} defaultValue={val(v, `bpTopic${i}`, v ? "" : topics[i] ?? "")} className={`${input} w-56`} />
              <select name={`bpDifficulty${i}`} aria-label={tr("Row {x} difficulty", { x: i + 1 })} defaultValue={val(v, `bpDifficulty${i}`)} className={input}>
                <option value="">{tr("Any difficulty")}</option><option value="easy">{tr("Easy")}</option><option value="medium">{tr("Medium")}</option><option value="hard">{tr("Hard")}</option>
              </select>
            </div>
          ))}
        </div>
        {rows < BLUEPRINT_ROWS && <button type="button" onClick={() => setRows(rows + 1)} className="mt-3 text-sm font-semibold text-navy-600 hover:underline">{tr("+ Add row")}</button>}
      </section>
      <div className="flex justify-end"><SubmitButton pendingText={tr("Generating…")} className="sm:w-auto">{tr("Generate paper")}</SubmitButton></div>
    </form>
  );
}
