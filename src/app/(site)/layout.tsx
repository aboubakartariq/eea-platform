import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { site } from "@/lib/site";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-navy-600 focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      {site.previewNotice && (
        <div className="bg-amber-50 text-center text-xs font-medium text-amber-900">
          <p className="container-page py-2">
            Preview website: competition grades, fees and dates are being finalised.
          </p>
        </div>
      )}
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
