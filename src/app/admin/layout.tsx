import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { getSession, homeFor, pendingStep } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { adminNav } from "@/components/admin/nav";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { MobileAdminNav } from "@/components/admin/mobile-nav";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | EEA Admin" }, robots: { index: false, follow: false } };

async function visibleNav() {
  const s = await getSession();
  if (!s) redirect("/login");
  const step = pendingStep(s);
  if (step) redirect(step);
  if (!s.user.isStaff) redirect(homeFor(s.user));
  return {
    user: s.user,
    groups: adminNav
      .map((g) => ({ ...g, items: g.items.filter((i) => s.user.permissions.has(i.permission)) }))
      .filter((g) => g.items.length > 0),
  };
}

async function Sidebar() {
  const { groups } = await visibleNav();
  return <SidebarNav groups={groups} />;
}

async function TopBar() {
  const { user, groups } = await visibleNav();
  return (
    <>
      <MobileAdminNav groups={groups} />
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-navy-900">{user.name}</p>
          <p className="text-xs text-muted">{user.roles.map((r) => r.name).join(", ")}</p>
        </div>
        <Link href="/account/password" className="grid size-9 place-items-center rounded-full bg-navy-600 font-display text-sm font-bold text-white" title="Account">
          {user.name.slice(0, 1).toUpperCase()}
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="grid size-9 place-items-center rounded-full text-muted hover:bg-navy-50 hover:text-navy-800" aria-label="Sign out" title="Sign out">
            <LogOut className="size-[18px]" />
          </button>
        </form>
      </div>
    </>
  );
}

const navSkeleton = (
  <div className="space-y-3" aria-hidden>
    {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-surface" />)}
  </div>
);

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="sticky top-0 hidden h-dvh w-68 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <Link href="/admin" className="flex h-16 items-center gap-3 border-b border-line px-5">
          <Image src="/brand/eea-seal.svg" alt="" width={36} height={36} />
          <span className="font-display text-sm font-bold text-navy-800">EEA Admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto p-4">
          <Suspense fallback={navSkeleton}>
            <Sidebar />
          </Suspense>
        </div>
        <div className="border-t border-line p-4 text-xs text-muted">
          <Link href="/" className="hover:text-navy-700">View public website →</Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <Suspense fallback={<div className="ml-auto h-9 w-40 animate-pulse rounded-full bg-surface" />}>
            <TopBar />
          </Suspense>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
