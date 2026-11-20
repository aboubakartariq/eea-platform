"use client";

import { useFormAction } from "@/lib/use-form-action";
import { useState } from "react";
import { val, vals, type FormValues } from "@/lib/form-values";
import { OPTION_IDS, QUESTION_TYPES } from "@/lib/questions";
import { GRADE_OPTIONS } from "@/lib/question-ui";
import { saveQuestionAction } from "./actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";

function Select({ label, name, value, options, error, onChange }: { label: string; name: string; value: string; options: { v: string; l: string }[]; error?: string; onChange?: (v: string) => void }) {
  const { msg } = useTr();
  return (
    <div>
      <label htmlFor={`f-${name}`} className="block text-sm font-semibold text-navy-900">{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={value} onChange={onChange && ((e) => onChange(e.target.value))} aria-invalid={error ? true : undefined} className={`mt-1.5 h-12 w-full rounded-xl border bg-white px-3 text-[15px] outline-none focus:border-navy-600 ${error ? "border-red-500" : "border-line"}`}>
        {options.map((o) => <option key={o.v} value={o.v}>{msg(o.l)}</option>)}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-700">{msg(error)}</p>}
    </div>
  );
}

export function QuestionForm({ initial, competitions, readOnly }: { initial: FormValues; competitions: { id: string; name: string }[]; readOnly?: boolean }) {
  const { tr } = useTr();
  const [state, action, , errorKey] = useFormAction(saveQuestionAction);
  // After an error show what was submitted; otherwise the saved question.
  const v = state?.values && state.error ? state.values : initial;
  const e = state?.fieldErrors ?? {};
  const [type, setType] = useState(val(v, "type", "single"));
  const correct = vals(v, "correct");
  const choice = type === "single" || type === "multiple";
  const id = val(initial, "id");

  return (
    <form key={errorKey} action={action} className="space-y-6">
      {id && <input type="hidden" name="id" value={id} />}
      <FormMessage error={state?.error} ok={state?.ok} />
      <fieldset disabled={readOnly} className="space-y-6">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Select label={tr("Competition")} name="competitionId" value={val(v, "competitionId")} error={e.competitionId} options={[{ v: "", l: tr("Choose…") }, ...competitions.map((c) => ({ v: c.id, l: c.name }))]} />
            <Select label={tr("First grade")} name="gradeFrom" value={val(v, "gradeFrom")} error={e.gradeFrom} options={[{ v: "", l: tr("Choose…") }, ...GRADE_OPTIONS]} />
            <Select label={tr("Last grade")} name="gradeTo" value={val(v, "gradeTo")} error={e.gradeTo} options={[{ v: "", l: tr("Choose…") }, ...GRADE_OPTIONS]} />
            <Select label={tr("Level")} name="level" value={val(v, "level", "1")} error={e.level} options={[{ v: "1", l: tr("Level 1") }, { v: "2", l: tr("Level 2") }, { v: "3", l: tr("Level 3") }]} />
            <Field label={tr("Topic")} name="topic" defaultValue={val(v, "topic")} error={e.topic} required maxLength={80} hint={tr("e.g. Fractions")} />
            <Select label={tr("Difficulty")} name="difficulty" value={val(v, "difficulty", "medium")} error={e.difficulty} options={[{ v: "easy", l: tr("Easy") }, { v: "medium", l: tr("Medium") }, { v: "hard", l: tr("Hard") }]} />
            <Field label={tr("Marks")} name="marks" type="number" min={1} max={20} defaultValue={val(v, "marks", "1")} error={e.marks} />
            <Field label={tr("Tags")} name="tags" defaultValue={val(v, "tags")} hint={tr("Optional, separated by commas")} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <div className="max-w-sm">
            <Select label={tr("Question type")} name="type" value={type} onChange={setType} error={e.type} options={QUESTION_TYPES.map((t) => ({ v: t.key, l: t.label }))} />
          </div>
          <div className="mt-5"><TextArea label={tr("Question")} name="stem" rows={4} defaultValue={val(v, "stem")} error={e.stem} required maxLength={4000} /></div>

          {choice && (
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-navy-900">{tr("Options")}{" "}<span className="font-normal text-muted">{type === "single" ? tr("· tick the correct one") : tr("· tick the correct ones")}</span></legend>
              <div className="mt-3 space-y-2.5">
                {OPTION_IDS.map((o) => (
                  <div key={o} className="flex items-center gap-3">
                    <input type={type === "single" ? "radio" : "checkbox"} name="correct" value={o} defaultChecked={correct.includes(o)} aria-label={tr("Option {o} is correct", { o })} className="size-5 accent-emerald-600" />
                    <span className="w-5 font-mono font-semibold text-navy-900">{o}</span>
                    <input name={`opt${o}`} defaultValue={val(v, `opt${o}`)} maxLength={500} aria-label={tr("Option {o}", { o })} placeholder={o < "C" ? tr("Required") : tr("Optional")} className="h-11 flex-1 rounded-xl border border-line bg-white px-4 text-[15px] outline-none focus:border-navy-600" />
                  </div>
                ))}
              </div>
              {(e.options || e.answer) && <p className="mt-2 text-sm text-red-700">{e.options ?? e.answer}</p>}
            </fieldset>
          )}
          {type === "true_false" && (
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-navy-900">{tr("Correct answer")}</legend>
              <div className="mt-3 flex gap-6">
                {[["A", tr("True")], ["B", tr("False")]].map(([id, l]) => (
                  <label key={id} className="flex items-center gap-2"><input type="radio" name="correct" value={id} defaultChecked={correct.includes(id)} className="size-5 accent-emerald-600" />{l}</label>
                ))}
              </div>
              {e.answer && <p className="mt-2 text-sm text-red-700">{e.answer}</p>}
            </fieldset>
          )}
          {type === "numeric" && (
            <div className="mt-5 grid max-w-lg gap-5 sm:grid-cols-2">
              <Field label={tr("Correct number")} name="numericValue" inputMode="decimal" defaultValue={val(v, "numericValue")} error={e.answer} />
              <Field label={tr("Allowed margin")} name="tolerance" inputMode="decimal" defaultValue={val(v, "tolerance")} error={e.tolerance} hint={tr("0 = exact")} />
            </div>
          )}
          {type === "short" && (
            <div className="mt-5"><TextArea label={tr("Accepted answers (one per line; capitals and full stops are ignored)")} name="accepted" rows={3} defaultValue={val(v, "accepted")} error={e.answer} /></div>
          )}
          <div className="mt-5"><TextArea label={tr("Explanation (optional, shown to students after results)")} name="explanation" rows={3} defaultValue={val(v, "explanation")} error={e.explanation} /></div>
        </section>
      </fieldset>
      {!readOnly && (
        <div className="flex justify-end">
          <SubmitButton pendingText={tr("Saving…")} className="sm:w-auto">{id ? tr("Save changes") : tr("Save draft")}</SubmitButton>
        </div>
      )}
    </form>
  );
}
