import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Accent } from "@/content/competitions";

export const accentStyles: Record<Accent, { soft: string; text: string; ring: string; solid: string }> = {
  gold: { soft: "bg-gold-50", text: "text-gold-700", ring: "ring-gold/30", solid: "bg-gold" },
  blue: { soft: "bg-brand-blue-50", text: "text-brand-blue", ring: "ring-brand-blue/25", solid: "bg-brand-blue" },
  magenta: { soft: "bg-magenta-50", text: "text-magenta", ring: "ring-magenta/25", solid: "bg-magenta" },
  navy: { soft: "bg-navy-50", text: "text-navy-600", ring: "ring-navy-600/25", solid: "bg-navy-600" },
};

export function Badge({ children, tone = "navy", className }: { children: ReactNode; tone?: Accent | "demo"; className?: string }) {
  const styles =
    tone === "demo"
      ? "bg-amber-50 text-amber-800 ring-amber-300/60"
      : `${accentStyles[tone].soft} ${accentStyles[tone].text} ${accentStyles[tone].ring}`;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", styles, className)}>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="dot-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="container-page relative py-16 sm:py-20">
        {eyebrow && <p className="eyebrow mb-3 animate-fade-up">{eyebrow}</p>}
        <h1 className="max-w-3xl animate-fade-up text-4xl font-bold sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl animate-fade-up text-lg leading-relaxed text-muted">{intro}</p>}
        {children && <div className="mt-8 animate-fade-up">{children}</div>}
      </div>
    </section>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-navy-900">
            {item.q}
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-600 transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-navy-200 bg-navy-50/50 p-6 sm:p-8">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2 leading-relaxed text-muted">{children}</div>
    </div>
  );
}
