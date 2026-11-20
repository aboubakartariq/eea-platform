import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";

/** Portals, sign-in and staff pages: English only, outside the language routes. */
const APP_PATHS = /^\/(admin|school|student|parent|certificates|admit-card|login|account)(\/|$)/;
/** Of those, the ones that need a session cookie (real checks happen on the server). */
const PROTECTED = /^\/(admin|account|school|student|parent|certificates|admit-card)(\/|$)|^\/login\/verify$/;

/** Best supported language from the browser's Accept-Language header. */
function fromHeader(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const w of wanted) if (isLocale(w.lang)) return w.lang;
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (APP_PATHS.test(pathname)) {
    if (PROTECTED.test(pathname) && !request.cookies.has("eea_session")) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];

  // "/en/..." is the same page as "/...": keep one address.
  if (first === DEFAULT_LOCALE) {
    const res = NextResponse.redirect(new URL((pathname.slice(3) || "/") + search, request.url), 308);
    res.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  if (isLocale(first)) return NextResponse.next();

  // An English address. Send first-time visitors to their own language once; after that the
  // language they chose (stored in a cookie by the language menu) wins.
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred = saved && isLocale(saved) ? saved : fromHeader(request.headers.get("accept-language"));
  if (preferred !== DEFAULT_LOCALE && (request.method === "GET" || request.method === "HEAD")) {
    return NextResponse.redirect(new URL(`/${preferred}${pathname === "/" ? "" : pathname}${search}`, request.url));
  }
  return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, request.url));
}

export const config = {
  // Everything except Next.js internals and files such as /brand/eea-seal.svg or /robots.txt.
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};

