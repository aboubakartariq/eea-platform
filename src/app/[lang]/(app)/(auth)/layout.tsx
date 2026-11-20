import Image from "next/image";
import Link from "next/link";
import { getTr } from "@/i18n/app-server";
import { LanguageMenu } from "@/components/layout/language-menu";
import { Suspense } from "react";

export const metadata = { robots: { index: false, follow: false } };

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { tr } = await getTr();
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-surface px-5 py-12">
      <Suspense fallback={null}><LanguageMenu className="absolute top-4 end-4 z-10" /></Suspense>
      <div className="dot-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <Link href="/" className="relative mb-8 flex items-center gap-3" aria-label={tr("EEA home")}>
        <Image src="/brand/eea-seal.svg" alt="" width={56} height={56} priority />
        <span className="font-display text-sm leading-tight font-semibold text-navy-800">
          {tr("Educational Extracurricular")}
          <br />
          {tr("Activities")}
        </span>
      </Link>
      <main className="relative w-full max-w-md rounded-[1.5rem] bg-white p-8 shadow-[0_30px_60px_-30px_rgba(20,22,74,0.35)] ring-1 ring-line sm:p-10">
        {children}
      </main>
      <p className="relative mt-8 text-xs text-muted">
        {tr("Need help signing in?")}{" "}<Link href="/contact" className="font-semibold text-navy-600 underline underline-offset-4">{tr("Contact EEA")}</Link>
      </p>
    </div>
  );
}
