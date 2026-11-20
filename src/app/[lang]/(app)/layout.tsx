import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getCatalogue } from "@/i18n/app-server";
import { PortalI18nProvider } from "@/i18n/app-client";

/** Portals, sign-in and staff pages. Same addresses in every language; the language comes from the visitor's saved choice. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const cat = await getCatalogue("portal", locale);
  return <PortalI18nProvider locale={locale} cat={cat}>{children}</PortalI18nProvider>;
}
