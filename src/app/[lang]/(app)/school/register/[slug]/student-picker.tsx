"use client";

import { useActionState, useMemo, useState } from "react";
import { createRegistrationAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { gradeName } from "@/lib/competition-types";
import { formatPKR } from "@/lib/utils";
import { useTr } from "@/i18n/app-client";

type S = { id: string; code: string; name: string; grade: number; section: string | null; registered: boolean };

export function StudentPicker({ competitionId, fee, modes, students }: { competitionId: string; fee: number; modes: string[]; students: S[] }) {
  const { tr, msg, intl } = useTr();
  const [state, action] = useActionState(createRegistrationAction, undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [grade, setGrade] = useState<number | "all">("all");
  const grades = useMemo(() => [...new Set(students.map((s) => s.grade))], [students]);
  const visible = students.filter((s) => grade === "all" || s.grade === grade);
  const selectable = visible.filter((s) => !s.registered);
  const allVisibleSelected = selectable.length > 0 && selectable.every((s) => selected.has(s.id));

  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleVisible = () => setSelected((prev) => { const n = new Set(prev); selectable.forEach((s) => (allVisibleSelected ? n.delete(s.id) : n.add(s.id))); return n; });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="competitionId" value={competitionId} />
      {[...selected].map((id) => <input key={id} type="hidden" name="studentIds" value={id} />)}
      <FormMessage error={state?.error} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setGrade("all")} className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ${grade === "all" ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line"}`}>{tr("All grades")}</button>
        {grades.map((g) => <button key={g} type="button" onClick={() => setGrade(g)} className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ${grade === g ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line"}`}>{msg(gradeName(g))}</button>)}
      </div>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface/60">
            <tr>
              <th className="w-12 px-5 py-3"><input type="checkbox" aria-label={tr("Select all shown")} checked={allVisibleSelected} onChange={toggleVisible} disabled={!selectable.length} className="size-4 accent-navy-600" /></th>
              <th className="px-5 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">{tr("Student")}</th>
              <th className="px-5 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">{tr("Grade")}</th>
              <th className="px-5 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">{tr("Student ID")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((s) => (
              <tr key={s.id} className={s.registered ? "text-muted" : "cursor-pointer hover:bg-surface/50"} onClick={() => !s.registered && toggle(s.id)}>
                <td className="px-5 py-3"><input type="checkbox" aria-label={tr("Select {name}", { name: s.name })} checked={s.registered || selected.has(s.id)} disabled={s.registered} onChange={() => toggle(s.id)} onClick={(e) => e.stopPropagation()} className="size-4 accent-navy-600" /></td>
                <td className="px-5 py-3 font-medium">{s.name}{s.registered && <span className="ms-2 text-xs font-normal">{tr("Already registered")}</span>}</td>
                <td className="px-5 py-3">{msg(gradeName(s.grade))}{s.section ? ` · ${s.section}` : ""}</td>
                <td className="px-5 py-3 font-mono text-xs">{s.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-surface/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <fieldset className="flex items-center gap-4 text-sm">
          <legend className="sr-only">{tr("Exam mode")}</legend>
          {modes.map((m, i) => (
            <label key={m} className="flex items-center gap-2"><input type="radio" name="mode" value={m} defaultChecked={i === 0} className="size-4 accent-navy-600" />{m === "online" ? tr("Online exam") : tr("Paper exam at school")}</label>
          ))}
        </fieldset>
        <p className="ms-auto text-sm">{tr("Selected: {n} · Total: {amount}", { n: selected.size, amount: formatPKR(selected.size * fee, intl) })}</p>
        <SubmitButton variant="gold" pendingText={tr("Registering…")} className="sm:w-auto">{selected.size ? tr("Register selected students ({n})", { n: selected.size }) : tr("Register students")}</SubmitButton>
      </div>
    </form>
  );
}
