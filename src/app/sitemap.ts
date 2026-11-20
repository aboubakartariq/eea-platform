import type { MetadataRoute } from "next";
import { getPublishedCompetitions } from "@/lib/competitions";
import { LOCALES, localePath } from "@/i18n/config";
import { site } from "@/lib/site";

const pages = ["/", "/about", "/competitions", "/olympiads", "/activities", "/schools", "/students", "/resources", "/results", "/verify", "/news", "/contact", "/register", "/privacy", "/terms", "/refunds"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const competitions = await getPublishedCompetitions();
  const paths = [...pages, ...competitions.map((c) => `/competitions/${c.slug}`)];
  const url = (p: string) => `${site.url.replace(/\/$/, "")}${p === "/" ? "" : p}`;
  // One entry per page and language, each listing every language version.
  return paths.flatMap((p) =>
    LOCALES.map((l) => ({
      url: url(localePath(l.code, p)),
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x.code, url(localePath(x.code, p))])) },
    })),
  );
}
