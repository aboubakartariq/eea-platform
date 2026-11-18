import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { requireSchool } from "@/lib/auth/school";
import { logoutAction } from "@/lib/auth/actions";
import { SchoolNav } from "./school-nav";

export const metadata: Metadata = { title: { default: "School portal", template: "%s | EEA School Portal" }, robots: { index: false, follow: false } };

async function SchoolBadge() {
  const { school, user } = await requireSchool();
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-navy-900">{school.name}</p>
        <p className="font-mono text-xs text-muted">{school.code}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden text-right text-sm sm:block"><span className="block font-medium text-navy-900">{user.name}</span><span className="block text-xs text-muted">{user.roles.map((r) => r.name).join(", ")}</span></span>
        <Link href="/account/password" className="grid size-9 place-items-center rounded-full bg-navy-600 font-display text-sm font-bold text-white" title="Account">{user.name.slice(0, 1).toUpperCase()}</Link>
        <form action={logoutAction}><button type="submit" className="grid size-9 place-items-center rounded-full text-muted hover:bg-navy-50" aria-label="Sign out" title="Sign out"><LogOut className="size-[18px]" /></button></form>
      </div>
    </div>
  );
}

export default function SchoolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/school" className="flex shrink-0 items-center gap-2"><Image src="/brand/eea-seal.svg" alt="EEA" width={36} height={36} /><span className="hidden font-display text-sm font-bold text-navy-800 md:block">School Portal</span></Link>
          <Suspense fallback={<div className="h-9 flex-1 animate-pulse rounded-full bg-surface" />}><SchoolBadge /></Suspense>
        </div>
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6"><Suspense fallback={<div className="h-11" />}><SchoolNav /></Suspense></div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
