import Image from "next/image";
import Link from "next/link";

export const metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-surface px-5 py-12">
      <div className="dot-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <Link href="/" className="relative mb-8 flex items-center gap-3" aria-label="EEA home">
        <Image src="/brand/eea-seal.svg" alt="" width={56} height={56} priority />
        <span className="font-display text-sm leading-tight font-semibold text-navy-800">
          Educational Extracurricular
          <br />
          Activities
        </span>
      </Link>
      <main className="relative w-full max-w-md rounded-[1.5rem] bg-white p-8 shadow-[0_30px_60px_-30px_rgba(20,22,74,0.35)] ring-1 ring-line sm:p-10">
        {children}
      </main>
      <p className="relative mt-8 text-xs text-muted">
        Need help signing in? <Link href="/contact" className="font-semibold text-navy-600 underline underline-offset-4">Contact EEA</Link>
      </p>
    </div>
  );
}
