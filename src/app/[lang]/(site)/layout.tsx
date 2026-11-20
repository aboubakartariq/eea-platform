import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getI18n } from "@/i18n/server";
import { site } from "@/lib/site";

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = await getI18n();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded-full focus:bg-navy-600 focus:px-4 focus:py-2 focus:text-white">
        {t.common.skip}
      </a>
      {site.previewNotice && (
        <div className="bg-amber-50 text-center text-xs font-medium text-amber-900">
          <p className="container-page py-2">{t.common.preview}</p>
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
