import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource-variable/inter";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { site } from "@/lib/site";
import { hasDemoContent } from "@/content/competitions";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Olympiads and competitions for students`, template: `%s | ${site.shortName}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: "en_PK", images: ["/brand/eea-seal.svg"] },
  robots: site.previewNotice ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = { themeColor: "#2e3192" };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: site.legalName,
  alternateName: site.shortName,
  url: site.url,
  logo: `${site.url}/brand/eea-seal.svg`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-navy-600 focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        {site.previewNotice && hasDemoContent && (
          <div className="bg-amber-50 text-center text-xs font-medium text-amber-900">
            <p className="container-page py-2">
              Preview website: competitions, fees and dates shown are samples for review.{" "}
              <Link href="/about" className="underline underline-offset-2">About EEA</Link>
            </p>
          </div>
        )}
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
