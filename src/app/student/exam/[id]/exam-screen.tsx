"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, CloudOff, Flag, Loader2 } from "lucide-react";
import type { AttemptResponse } from "@/db/schema";
import { focusLostAction, saveAnswerAction, submitExamAction } from "../../exam-actions";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExamQuestion = {
  id: string;
  number: number;
  type: "single" | "multiple" | "true_false" | "numeric" | "short";
  stem: string;
  marks: number;
  options: { id: string; text: string }[];
  response: AttemptResponse | null;
  flagged: boolean;
};

type Props = {
  attemptId: string;
  title: string;
  competition: string;
  instructions: string | null;
  negativePercent: number;
  questions: ExamQuestion[];
  deadline: number;
  serverNow: number;
};

type Entry = { response: AttemptResponse; flagged: boolean };
type SaveState = "saved" | "saving" | "offline";

const answered = (r?: AttemptResponse) => !!r && ((r.options?.length ?? 0) > 0 || (r.text ?? "").trim() !== "");
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(sec).padStart(2, "0")}`;
};

export function ExamScreen(p: Props) {
  const router = useRouter();
  // Difference between this device's clock and the server's, so a wrong device clock can't add time.
  const [offset] = useState(() => p.serverNow - Date.now());
  const [now, setNow] = useState(() => Date.now() + offset);
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(p.questions.map((q) => [q.id, { response: q.response ?? {}, flagged: q.flagged }])),
  );
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [reviewing, setReviewing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [closed, setClosed] = useState(false);

  // Latest unsaved value per question; sent one at a time, newest wins.
  const pending = useRef(new Map<string, Entry>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      while (pending.current.size) {
        const [pq, entry] = pending.current.entries().next().value as [string, Entry];
        setSaveState("saving");
        let result: Awaited<ReturnType<typeof saveAnswerAction>>;
        try {
          result = await saveAnswerAction({ attemptId: p.attemptId, pq, response: entry.response, flagged: entry.flagged });
        } catch {
          setSaveState("offline");
          setTimeout(() => void flush(), 4000);
          return;
        }
        // Drop it only if nothing newer arrived while saving.
        if (pending.current.get(pq) === entry) pending.current.delete(pq);
        if (!result.ok && result.reason === "closed") {
          pending.current.clear();
          setClosed(true);
          return;
        }
      }
      setSaveState("saved");
    } finally {
      flushing.current = false;
    }
  }, [p.attemptId]);

  const update = (q: ExamQuestion, change: Partial<Entry>, delay = 0) => {
    if (closed) return;
    const entry = { ...entries[q.id], ...change };
    setEntries((e) => ({ ...e, [q.id]: entry }));
    pending.current.set(q.id, entry);
    clearTimeout(timers.current.get(q.id));
    timers.current.set(q.id, setTimeout(() => void flush(), delay));
  };

  const finish = useCallback(async () => {
    setFinishing(true);
    timers.current.forEach(clearTimeout);
    await flush();
    try {
      await submitExamAction(p.attemptId);
    } finally {
      router.refresh();
    }
  }, [flush, p.attemptId, router]);

  // Countdown from the server's deadline; submits itself when time runs out.
  const remaining = p.deadline - now;
  const autoSubmitted = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 500);
    return () => clearInterval(t);
  }, [offset]);
  useEffect(() => {
    if ((remaining <= 0 || closed) && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void finish();
    }
  }, [remaining, closed, finish]);

  // Record leaving the exam tab; warn before closing with unsaved answers.
  useEffect(() => {
    let last = 0;
    const onHide = () => {
      if (document.visibilityState === "hidden" && Date.now() - last > 5000) {
        last = Date.now();
        void focusLostAction(p.attemptId).catch(() => {});
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size) e.preventDefault();
    };
    const onOnline = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("online", onOnline);
    };
  }, [flush, p.attemptId]);

  const q = p.questions[index];
  const e = entries[q.id];
  const done = p.questions.filter((x) => answered(entries[x.id]?.response)).length;
  const flagged = p.questions.filter((x) => entries[x.id]?.flagged).length;
  const low = remaining < 5 * 60_000;

  if (finishing) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <Loader2 className="mx-auto size-10 animate-spin text-navy-600" aria-hidden />
          <p className="mt-4 text-lg font-semibold">{remaining <= 0 || closed ? "Time is up. Submitting your answers…" : "Submitting your answers…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-4 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-navy-900">{p.competition}</p>
          <p className="truncate text-xs text-muted">{p.title}</p>
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {saveState === "saving" ? <span className="inline-flex items-center gap-1.5"><Loader2 className="size-4 animate-spin" aria-hidden />Saving…</span>
            : saveState === "offline" ? <span className="inline-flex items-center gap-1.5 font-semibold text-red-700"><CloudOff className="size-4" aria-hidden />No connection — your answers will be saved when it&apos;s back</span>
            : <span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="size-4" aria-hidden />All answers saved</span>}
        </p>
        <div role="timer" aria-label="Time left" className={cn("rounded-xl px-4 py-1.5 text-center font-display text-xl font-bold tabular-nums", low ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-navy-50 text-navy-900")}>
          {clock(remaining)}
        </div>
      </div>

      {reviewing ? (
        <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="text-xl font-bold">Ready to submit?</h2>
          <p className="mt-2 text-muted">You&apos;ve answered {done} of {p.questions.length} questions.{p.questions.length - done > 0 && ` ${p.questions.length - done} ${p.questions.length - done === 1 ? "is" : "are"} still blank.`}{flagged > 0 && ` ${flagged} marked for review.`} After you submit you can&apos;t change your answers.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void finish()} className={buttonClass("primary", "lg")}>Submit my answers</button>
            <button type="button" onClick={() => setReviewing(false)} className={buttonClass("outline", "lg")}>Go back</button>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8" aria-labelledby="q-title">
            <div className="flex items-start justify-between gap-4">
              <p id="q-title" className="text-sm font-semibold text-muted">Question {q.number} of {p.questions.length} · {q.marks} mark{q.marks === 1 ? "" : "s"}</p>
              <button type="button" onClick={() => update(q, { flagged: !e.flagged })} aria-pressed={e.flagged} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1", e.flagged ? "bg-amber-50 text-amber-800 ring-amber-300" : "text-muted ring-line hover:bg-surface")}>
                <Flag className="size-4" aria-hidden />{e.flagged ? "Marked for review" : "Mark for review"}
              </button>
            </div>
            <p dir="auto" className="mt-4 text-lg leading-relaxed whitespace-pre-line text-ink">{q.stem}</p>
            {q.type === "multiple" && <p className="mt-2 text-sm font-semibold text-brand-blue">Choose all the correct answers.</p>}

            <div className="mt-6">
              {q.type === "numeric" || q.type === "short" ? (
                <label className="block max-w-md">
                  <span className="text-sm font-semibold text-navy-900">Your answer</span>
                  <input
                    key={q.id}
                    dir="auto"
                    inputMode={q.type === "numeric" ? "decimal" : "text"}
                    autoComplete="off"
                    maxLength={q.type === "numeric" ? 30 : 200}
                    defaultValue={e.response.text ?? ""}
                    onChange={(ev) => {
                      const text = q.type === "numeric" ? ev.target.value.replace(/[^\d.,-]/g, "") : ev.target.value;
                      if (text !== ev.target.value) ev.target.value = text;
                      update(q, { response: { text } }, 700);
                    }}
                    onBlur={() => void flush()}
                    className="mt-2 h-14 w-full rounded-xl border border-line bg-white px-4 text-lg outline-none focus:border-navy-600 focus:ring-3 focus:ring-navy-600/15"
                  />
                </label>
              ) : (
                <fieldset>
                  <legend className="sr-only">Options</legend>
                  <div className="grid gap-3">
                    {q.options.map((o, i) => {
                      const chosen = e.response.options?.includes(o.id) ?? false;
                      const multi = q.type === "multiple";
                      return (
                        <label key={o.id} className={cn("flex cursor-pointer items-center gap-4 rounded-2xl px-5 py-4 ring-1 transition-colors", chosen ? "bg-navy-50 ring-2 ring-navy-600" : "ring-line hover:bg-surface")}>
                          <input
                            type={multi ? "checkbox" : "radio"}
                            name={`q-${q.id}`}
                            checked={chosen}
                            onChange={() => {
                              const cur = e.response.options ?? [];
                              const options = multi ? (chosen ? cur.filter((x) => x !== o.id) : [...cur, o.id]) : [o.id];
                              update(q, { response: { options } });
                            }}
                            className="sr-only"
                          />
                          <span className={cn("grid size-9 shrink-0 place-items-center rounded-full font-display font-bold", chosen ? "bg-navy-600 text-white" : "bg-surface text-navy-800")}>{String.fromCharCode(65 + i)}</span>
                          <span dir="auto" className="text-[17px]">{o.text}</span>
                        </label>
                      );
                    })}
                  </div>
                  {answered(e.response) && q.type !== "multiple" && (
                    <button type="button" onClick={() => update(q, { response: { options: [] } })} className="mt-3 text-sm text-muted hover:text-navy-700 hover:underline">Clear my answer</button>
                  )}
                </fieldset>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
              <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className={buttonClass("outline", "md", "disabled:opacity-40")}><ChevronLeft className="size-4" aria-hidden />Previous</button>
              {index < p.questions.length - 1 ? (
                <button type="button" onClick={() => setIndex(index + 1)} className={buttonClass("primary", "md")}>Next<ChevronRight className="size-4" aria-hidden /></button>
              ) : (
                <button type="button" onClick={() => setReviewing(true)} className={buttonClass("gold", "md")}>Finish</button>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <p className="text-sm font-semibold">{done} of {p.questions.length} answered</p>
              <nav aria-label="Questions" className="mt-3 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
                {p.questions.map((x, i) => {
                  const en = entries[x.id];
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Question ${x.number}${answered(en.response) ? ", answered" : ""}${en.flagged ? ", marked for review" : ""}`}
                      aria-current={i === index ? "step" : undefined}
                      className={cn(
                        "relative grid h-10 place-items-center rounded-lg text-sm font-semibold tabular-nums ring-1",
                        answered(en.response) ? "bg-navy-600 text-white ring-navy-600" : "bg-white text-navy-800 ring-line",
                        i === index && "ring-2 ring-gold",
                      )}
                    >
                      {x.number}
                      {en.flagged && <span className="absolute -top-1 -right-1 size-3 rounded-full bg-amber-500 ring-2 ring-white" />}
                    </button>
                  );
                })}
              </nav>
              <button type="button" onClick={() => setReviewing(true)} className={buttonClass("outline", "md", "mt-4 w-full")}>Finish and submit</button>
            </div>
            {(p.instructions || p.negativePercent > 0) && (
              <div className="rounded-2xl bg-white p-5 text-sm text-muted ring-1 ring-line">
                {p.instructions && <p className="whitespace-pre-line">{p.instructions}</p>}
                {p.negativePercent > 0 && <p className={p.instructions ? "mt-2" : ""}>A wrong answer loses {p.negativePercent}% of its marks. A blank answer loses nothing.</p>}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
