import "server-only";
import type { Locale } from "./config";
import { localeInfo } from "./config";
import { getLocale } from "./server";
import { makeTr, type Catalogue } from "./tr";

type Part = "portal" | "admin";

const loaders: Record<Part, Record<Exclude<Locale, "en">, () => Promise<{ default: Catalogue }>>> = {
  portal: {
    ar: () => import("./app/portal.ar.json"), ms: () => import("./app/portal.ms.json"), tr: () => import("./app/portal.tr.json"), ja: () => import("./app/portal.ja.json"),
    nl: () => import("./app/portal.nl.json"), fr: () => import("./app/portal.fr.json"), ru: () => import("./app/portal.ru.json"),
  },
  admin: {
    ar: () => import("./app/admin.ar.json"), ms: () => import("./app/admin.ms.json"), tr: () => import("./app/admin.tr.json"), ja: () => import("./app/admin.ja.json"),
    nl: () => import("./app/admin.nl.json"), fr: () => import("./app/admin.fr.json"), ru: () => import("./app/admin.ru.json"),
  },
};

const load = async (part: Part, locale: Locale): Promise<Catalogue> => (locale === "en" ? {} : (await loaders[part][locale]()).default);

export const getCatalogue = load;

/** Words for a portal, sign-in or staff page, in the visitor's language. */
export async function getTr() {
  const locale = await getLocale();
  const [admin, portal] = await Promise.all([load("admin", locale), load("portal", locale)]);
  const { tr, msg } = makeTr([admin, portal]);
  return { locale, tr, msg, intl: localeInfo(locale).intl };
}
