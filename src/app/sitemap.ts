import type { MetadataRoute } from "next";
import { getPublishedCompetitions } from "@/lib/competitions";
import { site } from "@/lib/site";

const pages = ["", "/about", "/competitions", "/olympiads", "/activities", "/schools", "/students", "/resources", "/results", "/verify", "/news", "/contact", "/register", "/privacy", "/terms", "/refunds"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const competitions = await getPublishedCompetitions();
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}` })),
    ...competitions.map((c) => ({ url: `${site.url}/competitions/${c.slug}` })),
  ];
}
