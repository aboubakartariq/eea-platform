import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return site.previewNotice
    ? { rules: { userAgent: "*", disallow: "/" } }
    : { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/school", "/student", "/parent", "/exam", "/api"] }, sitemap: `${site.url}/sitemap.xml` };
}
