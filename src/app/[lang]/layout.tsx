import type { Metadata, Viewport } from "next";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-arabic";
import "../globals.css";
import { LOCALES, localeInfo, localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  return LOCALES.map((l) => ({ lang: l.code }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.siteTitle, template: `%s | ${site.shortName}` },
    description: t.meta.description,
    applicationName: site.name,
    openGraph: { type: "website", siteName: site.name, locale: localeInfo(locale).og, images: ["/brand/eea-seal.svg"] },
    alternates: { canonical: localePath(locale, "/"), languages: Object.fromEntries(LOCALES.map((l) => [l.code, localePath(l.code, "/")])) },
    robots: site.previewNotice ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#2e3192" };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: site.legalName,
  alternateName: site.shortName,
  url: site.url,
  logo: `${site.url}/brand/eea-seal.svg`,
};

export default async function PublicRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return (
    <html lang={locale} dir={localeInfo(locale).dir}>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider locale={locale} t={t}>{children}</I18nProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
