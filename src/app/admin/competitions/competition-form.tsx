"use client";

import { useActionState } from "react";
import { vals } from "@/lib/form-values";
import { saveCompetitionAction } from "./actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";

export type CompetitionFormValues = {
  id?: string; name: string; slug: string; code: string; kind: string; accent: string; icon: string; summary: string;
  gradeFrom: string; gradeTo: string; modes: string[]; levels: string; durationMinutes: string; feePkr: string;
  registrationCloses: string; examDate: string; status: string; sortOrder: string;
  overview: string; objectives: string; eligibility: string; format: string; syllabus: string; rules: string; awards: string; faqs: string;
};

const grades = [{ v: "", l: "Not set" }, { v: "0", l: "KG" }, ...Array.from({ length: 12 }, (_, i) => ({ v: String(i + 1), l: `Grade ${i + 1}` }))];

function Select({ label, name, value, options, error }: { label: string; name: string; value: string; options: { v: string; l: string }[]; error?: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="block text-sm font-semibold text-navy-900">{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={value} className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-navy-600">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
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
  const [state, action] = useActionState(saveCompetitionAction, undefined);
  // After an error, show what was submitted rather than the last saved version.
  const values: CompetitionFormValues = state?.values && state.error
    ? { ...initial, ...Object.fromEntries(Object.entries(state.values).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])), modes: vals(state.values, "modes") }
    : initial;
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <FormMessage error={state?.error} ok={state?.ok} />

      <Section title="Basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" name="name" defaultValue={values.name} required error={e.name} />
          <Field label="Short code" name="code" defaultValue={values.code} required error={e.code} hint="Used on roll numbers, e.g. MMO." />
          <Field label="Web address name" name="slug" defaultValue={values.slug} error={e.slug} hint="Leave empty to create it from the name." />
          <Select label="Type" name="kind" value={values.kind} options={[{ v: "olympiad", l: "Olympiad" }, { v: "activity", l: "Extracurricular activity" }]} />
        </div>
        <Field label="One-line summary" name="summary" defaultValue={values.summary} required maxLength={240} error={e.summary} />
        <div className="grid gap-5 sm:grid-cols-3">
          <Select label="Colour" name="accent" value={values.accent} options={[{ v: "blue", l: "Blue" }, { v: "gold", l: "Gold" }, { v: "magenta", l: "Magenta" }, { v: "navy", l: "Navy" }]} />
          <Select label="Icon" name="icon" value={values.icon} options={[{ v: "sigma", l: "Maths" }, { v: "book", l: "Book" }, { v: "flask", l: "Science" }, { v: "brain", l: "Brain" }, { v: "spell", l: "Spelling" }, { v: "palette", l: "Art" }, { v: "globe", l: "Globe" }]} />
          <Field label="Display order" name="sortOrder" type="number" min={0} defaultValue={values.sortOrder} error={e.sortOrder} />
        </div>
      </Section>

      <Section title="Who, when and how much" hint="Schools can register only when all of these are set and the competition is published.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="First grade" name="gradeFrom" value={values.gradeFrom} options={grades} error={e.gradeFrom} />
          <Select label="Last grade" name="gradeTo" value={values.gradeTo} options={grades} error={e.gradeTo} />
          <Field label="Fee per student (PKR)" name="feePkr" type="number" min={0} defaultValue={values.feePkr} error={e.feePkr} />
          <Field label="Duration (minutes)" name="durationMinutes" type="number" min={10} defaultValue={values.durationMinutes} error={e.durationMinutes} />
          <Field label="Registration closes" name="registrationCloses" type="date" defaultValue={values.registrationCloses} error={e.registrationCloses} />
          <Field label="Exam date" name="examDate" type="date" defaultValue={values.examDate} error={e.examDate} />
          <Select label="Levels" name="levels" value={values.levels} options={[{ v: "1", l: "1 level" }, { v: "2", l: "2 levels" }, { v: "3", l: "3 levels" }]} />
          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">Exam modes</legend>
            <div className="mt-3 flex gap-4">
              {["online", "paper"].map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" name="modes" value={m} defaultChecked={values.modes.includes(m)} className="size-4 accent-navy-600" />{m}</label>
              ))}
            </div>
            {e.modes && <p className="mt-1.5 text-sm text-red-700">{e.modes}</p>}
          </fieldset>
        </div>
      </Section>

      <Section title="Page content" hint="One item per line. Where a line has two parts, separate them with a colon.">
        <TextArea label="Overview" name="overview" rows={4} defaultValue={values.overview} />
        <div className="grid gap-5 lg:grid-cols-2">
          <TextArea label="Objectives (one per line)" name="objectives" defaultValue={values.objectives} />
          <TextArea label="Extra eligibility notes (one per line)" name="eligibility" defaultValue={values.eligibility} />
          <TextArea label="Exam format (Label: value)" name="format" defaultValue={values.format} />
          <TextArea label="Syllabus (Grades 1–2: topic; topic)" name="syllabus" defaultValue={values.syllabus} />
          <TextArea label="Rules (one per line)" name="rules" defaultValue={values.rules} />
          <TextArea label="Awards (Title: detail)" name="awards" defaultValue={values.awards} />
        </div>
        <TextArea label="FAQs (Q: question, then A: answer on the next line)" name="faqs" rows={6} defaultValue={values.faqs} />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-end gap-4 border-t border-line bg-surface/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="w-56">
          <Select label="Status" name="status" value={values.status} options={[{ v: "draft", l: "Draft (hidden)" }, { v: "published", l: "Published" }, { v: "archived", l: "Archived" }]} error={e.status} />
        </div>
        {!canPublish && <p className="pb-3 text-xs text-muted">You can save drafts. Publishing needs the publish permission.</p>}
        <SubmitButton pendingText="Saving…" className="sm:w-auto">Save competition</SubmitButton>
      </div>
    </form>
  );
}
