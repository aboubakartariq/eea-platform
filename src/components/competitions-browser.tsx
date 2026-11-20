"use client";

import { useMemo, useState } from "react";
import { isEligible, type PublicCompetition } from "@/lib/competition-types";
import { CompetitionCard } from "@/components/competition-card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { gradeText } from "@/i18n/format";

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

export function CompetitionsBrowser({ items }: { items: PublicCompetition[] }) {
  const { t } = useI18n();
  const l = t.competitions;
  const [kind, setKind] = useState<"all" | PublicCompetition["kind"]>("all");
  const [mode, setMode] = useState<"all" | "online" | "paper">("all");
  const [grade, setGrade] = useState<number | "all">("all");

  const filtered = useMemo(
    () =>
      items
        .filter((c) => kind === "all" || c.kind === kind)
        .filter((c) => mode === "all" || c.modes.includes(mode))
        .filter((c) => grade === "all" || c.gradeFrom == null || isEligible(c, grade)),
    [items, kind, mode, grade],
  );

  return (
    <div>
      <div className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-2 w-20 text-sm font-semibold text-navy-900">{l.type}</span>
          <Chip active={kind === "all"} onClick={() => setKind("all")}>{l.all}</Chip>
          <Chip active={kind === "olympiad"} onClick={() => setKind("olympiad")}>{t.nav.olympiads}</Chip>
          <Chip active={kind === "activity"} onClick={() => setKind("activity")}>{t.nav.extracurricular}</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-2 w-20 text-sm font-semibold text-navy-900">{l.mode}</span>
          <Chip active={mode === "all"} onClick={() => setMode("all")}>{l.any}</Chip>
          <Chip active={mode === "online"} onClick={() => setMode("online")}>{t.common.online}</Chip>
          <Chip active={mode === "paper"} onClick={() => setMode("paper")}>{t.common.paper}</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="grade" className="me-2 w-20 text-sm font-semibold text-navy-900">{l.grade}</label>
          <select
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-10 rounded-full bg-white px-4 text-sm ring-1 ring-line focus:ring-navy-600"
          >
            <option value="all">{t.grades.all}</option>
            {grades.map((g) => (
              <option key={g} value={g}>{gradeText(t, g)}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted" aria-live="polite">
        {fill(l.found, { n: filtered.length })}
      </p>
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CompetitionCard key={c.slug} c={c} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-muted">
          {l.none}
        </div>
      )}
    </div>
  );
}
