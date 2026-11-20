import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { PortalNav } from "./portal-nav";
import { getTr } from "@/i18n/app-server";
import { LanguageMenu } from "@/components/layout/language-menu";

export async function UserChip({ name, subtitle }: { name: string; subtitle: string }) {
  const { tr } = await getTr();
  return (
    <div className="ms-auto flex items-center gap-2">
      <span className="hidden text-end text-sm sm:block"><span className="block font-medium text-navy-900">{name}</span><span className="block text-xs text-muted">{subtitle}</span></span>
      <Link href="/account/password" className="grid size-9 place-items-center rounded-full bg-navy-600 font-display text-sm font-bold text-white" title={tr("Account")}>{name.slice(0, 1).toUpperCase()}</Link>
      <form action={logoutAction}><button type="submit" className="grid size-9 place-items-center rounded-full text-muted hover:bg-navy-50" aria-label={tr("Sign out")} title={tr("Sign out")}><LogOut className="size-[18px]" /></button></form>
    </div>
  );
}

export function PortalShell({ label, root, nav, badge, children }: { label: string; root: string; nav: { href: string; label: string }[]; badge: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href={root} className="flex shrink-0 items-center gap-2"><Image src="/brand/eea-seal.svg" alt="EEA" width={36} height={36} /><span className="font-display text-sm font-bold text-navy-800">{label}</span></Link>
          <div className="ms-auto flex items-center gap-2"><Suspense fallback={null}><LanguageMenu /></Suspense><Suspense fallback={<div className="h-9 w-40 animate-pulse rounded-full bg-surface" />}>{badge}</Suspense></div>
        </div>
        <div className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6"><Suspense fallback={<div className="h-11" />}><PortalNav items={nav} root={root} /></Suspense></div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
