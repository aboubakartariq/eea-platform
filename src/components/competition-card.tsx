"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Brain, CalendarDays, FlaskConical, Globe2, Palette, Sigma, SpellCheck } from "lucide-react";
import type { PublicCompetition } from "@/lib/competition-types";
import { useI18n } from "@/i18n/client";
import { competitionText, dateShort, gradesText, pkr } from "@/i18n/format";
import { accentStyles, Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export const competitionIcons = {
  sigma: Sigma,
  flask: FlaskConical,
  book: BookOpen,
  spell: SpellCheck,
  palette: Palette,
  globe: Globe2,
  brain: Brain,
} as const;

export function CompetitionIcon({ c, className }: { c: Pick<PublicCompetition, "icon" | "accent">; className?: string }) {
  const Icon = competitionIcons[c.icon as keyof typeof competitionIcons] ?? BookOpen;
  const a = accentStyles[c.accent];
  return (
    <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", a.soft, a.text, className)}>
      <Icon className="size-6" aria-hidden />
    </span>
  );
}

export function CompetitionCard({ c }: { c: PublicCompetition }) {
  const { t, href, intl } = useI18n();
  const text = competitionText(t, c);
  return (
    <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_18px_40px_-24px_rgba(20,22,74,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <CompetitionIcon c={c} />
        <div className="flex flex-wrap justify-end gap-1.5">
          {c.modes.map((m) => (
            <Badge key={m} tone="navy">{m === "online" ? t.common.online : t.common.paper}</Badge>
          ))}
        </div>
      </div>
      <h3 className="mt-5 text-xl font-bold">
        <Link href={href(`/competitions/${c.slug}`)} className="after:absolute after:inset-0 after:content-['']">
          {text.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm font-medium text-brand-blue">{gradesText(t, c)}</p>
      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">{text.summary}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 text-sm">
        <div>
          <dt className="text-xs text-muted">{t.competitions.examDate}</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-navy-900">
            <CalendarDays className="size-4 text-gold" aria-hidden />
            {c.examDate ? dateShort(intl, c.examDate) : t.common.tba}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.competitions.fee}</dt>
          <dd className="mt-0.5 font-semibold text-navy-900">{c.feePkr != null ? pkr(intl, c.feePkr) : t.common.tba}</dd>
        </div>
      </dl>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600">
        {t.common.viewDetails}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden />
      </span>
    </article>
  );
}
