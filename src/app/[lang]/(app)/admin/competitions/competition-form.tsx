"use client";

import { useFormAction } from "@/lib/use-form-action";
import { vals } from "@/lib/form-values";
import { saveCompetitionAction } from "./actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { useTr } from "@/i18n/app-client";
import { N_ } from "@/i18n/tr";

export type CompetitionFormValues = {
  id?: string; name: string; slug: string; code: string; kind: string; accent: string; icon: string; summary: string;
  gradeFrom: string; gradeTo: string; modes: string[]; levels: string; durationMinutes: string; feePkr: string;
  registrationCloses: string; examDate: string; status: string; sortOrder: string;
  overview: string; objectives: string; eligibility: string; format: string; syllabus: string; rules: string; awards: string; faqs: string;
};

const grades = [{ v: "", l: N_("Not set") }, { v: "0", l: N_("KG") }, ...Array.from({ length: 12 }, (_, i) => ({ v: String(i + 1), l: `Grade ${i + 1}` }))];

function Select({ label, name, value, options, error }: { label: string; name: string; value: string; options: { v: string; l: string }[]; error?: string }) {
  const { msg } = useTr();
  return (
    <div>
      <label htmlFor={`f-${name}`} className="block text-sm font-semibold text-navy-900">{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={value} className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-navy-600">
        {options.map((o) => <option key={o.v} value={o.v}>{msg(o.l)}</option>)}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-700">{msg(error)}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function CompetitionForm({ values: initial, canPublish }: { values: CompetitionFormValues; canPublish: boolean }) {
  const { tr } = useTr();
  const [state, action, , errorKey] = useFormAction(saveCompetitionAction);
  // After an error, show what was submitted rather than the last saved version.
  const values: CompetitionFormValues = state?.values && state.error
    ? { ...initial, ...Object.fromEntries(Object.entries(state.values).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])), modes: vals(state.values, "modes") }
    : initial;
  const e = state?.fieldErrors ?? {};
  return (
    <form key={errorKey} action={action} className="space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <FormMessage error={state?.error} ok={state?.ok} />

      <Section title={tr("Basics")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tr("Name")} name="name" defaultValue={values.name} required error={e.name} />
          <Field label={tr("Short code")} name="code" defaultValue={values.code} required error={e.code} hint={tr("Used on roll numbers, e.g. MMO.")} />
          <Field label={tr("Web address name")} name="slug" defaultValue={values.slug} error={e.slug} hint={tr("Leave empty to create it from the name.")} />
          <Select label={tr("Type")} name="kind" value={values.kind} options={[{ v: "olympiad", l: tr("Olympiad") }, { v: "activity", l: tr("Extracurricular activity") }]} />
        </div>
        <Field label={tr("One-line summary")} name="summary" defaultValue={values.summary} required maxLength={240} error={e.summary} />
        <div className="grid gap-5 sm:grid-cols-3">
          <Select label={tr("Colour")} name="accent" value={values.accent} options={[{ v: "blue", l: tr("Blue") }, { v: "gold", l: tr("Gold") }, { v: "magenta", l: tr("Magenta") }, { v: "navy", l: tr("Navy") }]} />
          <Select label={tr("Icon")} name="icon" value={values.icon} options={[{ v: "sigma", l: tr("Maths") }, { v: "book", l: tr("Book") }, { v: "flask", l: tr("Science") }, { v: "brain", l: tr("Brain") }, { v: "spell", l: tr("Spelling") }, { v: "palette", l: tr("Art") }, { v: "globe", l: tr("Globe") }]} />
          <Field label={tr("Display order")} name="sortOrder" type="number" min={0} defaultValue={values.sortOrder} error={e.sortOrder} />
        </div>
      </Section>

      <Section title={tr("Who, when and how much")} hint={tr("Schools can register only when all of these are set and the competition is published.")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Select label={tr("First grade")} name="gradeFrom" value={values.gradeFrom} options={grades} error={e.gradeFrom} />
          <Select label={tr("Last grade")} name="gradeTo" value={values.gradeTo} options={grades} error={e.gradeTo} />
          <Field label={tr("Fee per student (PKR)")} name="feePkr" type="number" min={0} defaultValue={values.feePkr} error={e.feePkr} />
          <Field label={tr("Duration (minutes)")} name="durationMinutes" type="number" min={10} defaultValue={values.durationMinutes} error={e.durationMinutes} />
          <Field label={tr("Registration closes")} name="registrationCloses" type="date" defaultValue={values.registrationCloses} error={e.registrationCloses} />
          <Field label={tr("Exam date")} name="examDate" type="date" defaultValue={values.examDate} error={e.examDate} />
          <Select label={tr("Levels")} name="levels" value={values.levels} options={[{ v: "1", l: tr("1 level") }, { v: "2", l: tr("2 levels") }, { v: "3", l: tr("3 levels") }]} />
          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">{tr("Exam modes")}</legend>
            <div className="mt-3 flex gap-4">
              {["online", "paper"].map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" name="modes" value={m} defaultChecked={values.modes.includes(m)} className="size-4 accent-navy-600" />{m}</label>
              ))}
            </div>
            {e.modes && <p className="mt-1.5 text-sm text-red-700">{e.modes}</p>}
          </fieldset>
        </div>
      </Section>

      <Section title={tr("Page content")} hint={tr("One item per line. Where a line has two parts, separate them with a colon.")}>
        <TextArea label={tr("Overview")} name="overview" rows={4} defaultValue={values.overview} />
        <div className="grid gap-5 lg:grid-cols-2">
          <TextArea label={tr("Objectives (one per line)")} name="objectives" defaultValue={values.objectives} />
          <TextArea label={tr("Extra eligibility notes (one per line)")} name="eligibility" defaultValue={values.eligibility} />
          <TextArea label={tr("Exam format (Label: value)")} name="format" defaultValue={values.format} />
          <TextArea label={tr("Syllabus (Grades 1–2: topic; topic)")} name="syllabus" defaultValue={values.syllabus} />
          <TextArea label={tr("Rules (one per line)")} name="rules" defaultValue={values.rules} />
          <TextArea label={tr("Awards (Title: detail)")} name="awards" defaultValue={values.awards} />
        </div>
        <TextArea label={tr("FAQs (Q: question, then A: answer on the next line)")} name="faqs" rows={6} defaultValue={values.faqs} />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-end gap-4 border-t border-line bg-surface/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="w-56">
          <Select label={tr("Status")} name="status" value={values.status} options={[{ v: "draft", l: tr("Draft (hidden)") }, { v: "published", l: tr("Published") }, { v: "archived", l: tr("Archived") }]} error={e.status} />
        </div>
        {!canPublish && <p className="pb-3 text-xs text-muted">{tr("You can save drafts. Publishing needs the publish permission.")}</p>}
        <SubmitButton pendingText={tr("Saving…")} className="sm:w-auto">{tr("Save competition")}</SubmitButton>
      </div>
    </form>
  );
}
