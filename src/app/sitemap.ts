import type { MetadataRoute } from "next";
import { competitions } from "@/content/competitions";
import { site } from "@/lib/site";

const pages = ["", "/about", "/competitions", "/olympiads", "/activities", "/schools", "/students", "/resources", "/results", "/verify", "/news", "/contact", "/register", "/privacy", "/terms", "/refunds"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}` })),
    ...competitions.map((c) => ({ url: `${site.url}/competitions/${c.slug}` })),
  ];
}
