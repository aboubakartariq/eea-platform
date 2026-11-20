import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, isLocale, localeInfo, localePath, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en").then((m) => m.default),
  ar: () => import("./dictionaries/ar").then((m) => m.default),
  ms: () => import("./dictionaries/ms").then((m) => m.default),
  tr: () => import("./dictionaries/tr").then((m) => m.default),
  ja: () => import("./dictionaries/ja").then((m) => m.default),
  nl: () => import("./dictionaries/nl").then((m) => m.default),
  fr: () => import("./dictionaries/fr").then((m) => m.default),
  ru: () => import("./dictionaries/ru").then((m) => m.default),
};

/** The language of the current public page (from the address). */
export async function getLocale(): Promise<Locale> {
  const l = await lang();
  if (!isLocale(l)) notFound();
  return l;
}

export async function getDictionary(locale?: Locale) {
  return loaders[locale ?? (await getLocale())]();
}

/** Everything a server component needs: the words, the language and a link helper. */
export async function getI18n() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return { locale, t, href: (p: string) => localePath(locale, p), intl: localeInfo(locale).intl };
}

/** Translated message for a server action, from the hidden "locale" form field. */
export async function actionMessages(formData: FormData) {
  const raw = String(formData.get("locale") ?? DEFAULT_LOCALE);
  const t = await getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);
  return (msg: string | undefined) => (msg ? (t.messages as Record<string, string>)[msg] ?? msg : msg);
}

type MetaKey = { [K in keyof Dictionary["meta"]]: Dictionary["meta"][K] extends { title: string } ? K : never }[keyof Dictionary["meta"]];

/** Title, description and links to the same page in every language. */
export async function pageMetadata(key: MetaKey, path: string): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const m = t.meta[key] as { title: string; description?: string };
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: localePath(locale, path),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l.code, localePath(l.code, path)])), "x-default": path },
    },
  };
}

/** Translates a form action's messages into the language of the form that sent it. */
export async function localizeState<S extends { error?: string; fieldErrors?: Record<string, string> } | undefined>(state: S, formData: FormData): Promise<S> {
  if (!state || (!state.error && !state.fieldErrors)) return state;
  const tr = await actionMessages(formData);
  return {
    ...state,
    error: tr(state.error),
    fieldErrors: state.fieldErrors && Object.fromEntries(Object.entries(state.fieldErrors).map(([k, v]) => [k, tr(v) ?? v])),
  };
}
