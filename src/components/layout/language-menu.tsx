"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES, LOCALE_COOKIE, localePath, stripLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Stores the visitor's choice so English addresses don't redirect them again. */
function rememberLanguage(code: string) {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/** Switches language on the same page and remembers the choice. */
export function LanguageMenu({ className, onPick, full }: { className?: string; onPick?: () => void; full?: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale)!;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const remember = (code: string) => {
    rememberLanguage(code);
    onPick?.();
  };

  return (
    <div ref={box} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${t.common.language}: ${current.name}`}
        className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap text-navy-800 hover:bg-navy-50"
      >
        <Globe className="size-5" aria-hidden />
        <span className={full ? "" : "hidden xl:inline"}>{current.name}</span>
        {!full && <span className="font-semibold uppercase xl:hidden">{current.code}</span>}
      </button>
      {open && (
        <ul className={cn("absolute top-full", full ? "start-0" : "end-0", "z-50 mt-2 w-52 rounded-2xl border border-line bg-white p-2 shadow-xl shadow-navy-900/10")} role="list">
          {LOCALES.map((l) => (
            <li key={l.code}>
              <a
                href={localePath(l.code, stripLocale(pathname))}
                hrefLang={l.code}
                lang={l.code}
                onClick={() => remember(l.code)}
                aria-current={l.code === locale ? "true" : undefined}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm hover:bg-surface"
              >
                <span className={l.code === locale ? "font-semibold text-navy-900" : "text-ink"}>{l.name}</span>
                {l.code === locale && <Check className="size-4 text-brand-blue" aria-hidden />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
