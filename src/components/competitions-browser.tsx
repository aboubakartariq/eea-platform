"use client";

import { useMemo, useState } from "react";
import type { Competition } from "@/content/competitions";
import { CompetitionCard } from "@/components/competition-card";
import { cn } from "@/lib/utils";

const grades = Array.from({ length: 10 }, (_, i) => i + 1);

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-10 rounded-full px-4 text-sm font-medium ring-1 transition-colors",
        active ? "bg-navy-600 text-white ring-navy-600" : "bg-white text-ink ring-line hover:ring-navy-200",
      )}
    >
      {children}
    </button>
  );
}

export function CompetitionsBrowser({ items }: { items: Competition[] }) {
  const [kind, setKind] = useState<"all" | Competition["kind"]>("all");
  const [mode, setMode] = useState<"all" | "Online" | "Paper">("all");
  const [grade, setGrade] = useState<number | "all">("all");

  const filtered = useMemo(
    () =>
      items
        .filter((c) => kind === "all" || c.kind === kind)
        .filter((c) => mode === "all" || c.modes.includes(mode))
        .filter((c) => grade === "all" || (grade >= c.grades.from && grade <= c.grades.to))
        .sort((a, b) => a.examDate.localeCompare(b.examDate)),
    [items, kind, mode, grade],
  );

  return (
    <div>
      <div className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 w-16 text-sm font-semibold text-navy-900">Type</span>
          <Chip active={kind === "all"} onClick={() => setKind("all")}>All</Chip>
          <Chip active={kind === "olympiad"} onClick={() => setKind("olympiad")}>Olympiads</Chip>
          <Chip active={kind === "activity"} onClick={() => setKind("activity")}>Extracurricular</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 w-16 text-sm font-semibold text-navy-900">Mode</span>
          <Chip active={mode === "all"} onClick={() => setMode("all")}>Any</Chip>
          <Chip active={mode === "Online"} onClick={() => setMode("Online")}>Online</Chip>
          <Chip active={mode === "Paper"} onClick={() => setMode("Paper")}>Paper</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="grade" className="mr-2 w-16 text-sm font-semibold text-navy-900">Grade</label>
          <select
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-10 rounded-full bg-white px-4 text-sm ring-1 ring-line focus:ring-navy-600"
          >
            <option value="all">All grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "competition" : "competitions"} found
      </p>
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CompetitionCard key={c.slug} c={c} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-muted">
          No competitions match these filters. Try another grade or mode.
        </div>
      )}
    </div>
  );
}
