/** Languages of the public website. English is the default and has no prefix in the address. */
export const LOCALES = [
  { code: "en", name: "English", dir: "ltr", intl: "en-GB", og: "en_PK" },
  { code: "ar", name: "العربية", dir: "rtl", intl: "ar-u-nu-latn", og: "ar_AR" },
  { code: "ms", name: "Bahasa Melayu", dir: "ltr", intl: "ms-MY", og: "ms_MY" },
  { code: "tr", name: "Türkçe", dir: "ltr", intl: "tr-TR", og: "tr_TR" },
  { code: "ja", name: "日本語", dir: "ltr", intl: "ja-JP", og: "ja_JP" },
  { code: "nl", name: "Nederlands", dir: "ltr", intl: "nl-NL", og: "nl_NL" },
  { code: "fr", name: "Français", dir: "ltr", intl: "fr-FR", og: "fr_FR" },
  { code: "ru", name: "Русский", dir: "ltr", intl: "ru-RU", og: "ru_RU" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_CODES = LOCALES.map((l) => l.code) as Locale[];
export const LOCALE_COOKIE = "eea_lang";

export const isLocale = (v: string): v is Locale => (LOCALE_CODES as string[]).includes(v);
export const localeInfo = (l: Locale) => LOCALES.find((x) => x.code === l)!;

/** "/competitions" → "/fr/competitions"; English keeps the plain address. */
export function localePath(locale: Locale, path: string) {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return p;
  return p === "/" ? `/${locale}` : `/${locale}${p}`;
}

/** Removes a language prefix: "/fr/competitions" → "/competitions". */
export function stripLocale(pathname: string) {
  const m = pathname.match(/^\/([a-z]{2})(?=\/|$)/);
  if (m && isLocale(m[1])) return pathname.slice(3) || "/";
  return pathname;
}

/** Fills {name} style placeholders. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
