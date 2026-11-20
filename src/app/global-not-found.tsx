import "@fontsource/montserrat/700.css";
import "@fontsource-variable/inter";
import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Page not found | EEA", robots: { index: false } };

/** For addresses that match no page at all (the public site has its own, translated 404). */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-surface p-6 text-center">
        <div>
          <Image src="/brand/eea-seal.svg" alt="" width={120} height={120} className="mx-auto" />
          <h1 className="mt-6 text-3xl font-bold">Page not found</h1>
          <p className="mt-2 text-muted">The page you are looking for has moved or does not exist.</p>
          {/* A plain link: this page is shown outside the app's router. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="mt-6 inline-block font-semibold text-navy-600 underline underline-offset-4">Go to the homepage</a>
        </div>
      </body>
    </html>
  );
}
