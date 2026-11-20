"use client";

import { createContext, useContext, useMemo } from "react";
import { makeTr, type Catalogue } from "./tr";
import { DEFAULT_LOCALE, localeInfo, type Locale } from "./config";

const PortalCtx = createContext<{ locale: Locale; cat: Catalogue } | null>(null);
const AdminCtx = createContext<Catalogue | null>(null);

export function PortalI18nProvider({ locale, cat, children }: { locale: Locale; cat: Catalogue; children: React.ReactNode }) {
  return <PortalCtx.Provider value={{ locale, cat }}>{children}</PortalCtx.Provider>;
}

export function AdminI18nProvider({ cat, children }: { cat: Catalogue; children: React.ReactNode }) {
  return <AdminCtx.Provider value={cat}>{children}</AdminCtx.Provider>;
}

/** tr() and msg() for client components on portal, sign-in and staff pages. Outside them, English. */
export function useTr() {
  const portal = useContext(PortalCtx);
  const admin = useContext(AdminCtx);
  return useMemo(() => {
    const locale = portal?.locale ?? DEFAULT_LOCALE;
    const cats = [admin, portal?.cat].filter(Boolean) as Catalogue[];
    return { locale, intl: localeInfo(locale).intl, ...makeTr(cats) };
  }, [portal, admin]);
}
