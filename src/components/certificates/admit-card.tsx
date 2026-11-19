import Image from "next/image";
import { gradeName } from "@/lib/competition-types";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import type { AdmitCardData } from "@/lib/server/admit-cards";

export function AdmitCard({ c }: { c: AdmitCardData }) {
  const rows: [string, string][] = [
    ["Student", `${c.first} ${c.last}`],
    ["Student ID", c.code],
    ["Grade", `${gradeName(c.grade)}${c.section ? ` · ${c.section}` : ""}`],
    ["School", c.school ?? "Individual entry"],
    ["Exam date", c.examDate ? formatDate(c.examDate) : "To be announced"],
    ["Mode", c.mode === "online" ? "Online" : `On paper at ${c.school ? "school" : "the exam centre"}`],
  ];
  if (c.mode === "paper") rows.push(["Paper version", c.version ?? "Given on the day"]);
  const minutes = c.paperDuration ?? c.duration;
  return (
    <article className="admit-card break-inside-avoid rounded-2xl bg-white p-6 ring-2 ring-navy-700 print:mb-[8mm] print:rounded-none">
      <header className="flex items-center gap-4 border-b-2 border-gold pb-3">
        <Image src="/brand/eea-seal.svg" alt="" width={54} height={54} />
        <div className="flex-1">
          <p className="font-display text-xs font-bold tracking-widest text-navy-700 uppercase">{site.name}</p>
          <h2 className="font-display text-xl font-bold text-navy-900">Admit card · {c.competition}</h2>
        </div>
        <div className="rounded-xl bg-navy-600 px-4 py-2 text-center text-white">
          <p className="text-[10px] font-semibold tracking-wider uppercase">Roll number</p>
          <p className="font-mono text-lg font-bold">{c.roll}</p>
        </div>
      </header>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
      </dl>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted">
        {c.mode === "online" ? (
          <>
            <li>Sign in at {site.url.replace(/^https?:\/\//, "")}/login with your student ID and password. The Start button appears when the exam opens.</li>
            <li>Once you start, you have {minutes ? `${minutes} minutes` : "the full exam time"}; the clock keeps running if you close the page. Answers save as you go.</li>
          </>
        ) : (
          <>
            <li>Bring this card and a blue or black pen. Write your roll number and version on the answer sheet.</li>
            <li>The exam lasts {minutes ? `${minutes} minutes` : "the time printed on the paper"}. Calculators and phones are not allowed.</li>
          </>
        )}
      </ul>
    </article>
  );
}
