"use client";

import { createContext, useContext } from "react";
import { localeInfo, localePath, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

const Ctx = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: Dictionary; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, t }}>{children}</Ctx.Provider>;
}

/** Words, language and a link helper for client components on the public site. */
export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside the public site");
  return { ...v, href: (p: string) => localePath(v.locale, p), intl: localeInfo(v.locale).intl };
}

/** Hidden field so server actions can reply in the visitor's language. */
export function LocaleField() {
  const { locale } = useI18n();
  return <input type="hidden" name="locale" value={locale} />;
}
