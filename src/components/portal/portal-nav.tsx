"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTr } from "@/i18n/app-client";

export function PortalNav({ items, root }: { items: { href: string; label: string }[]; root: string }) {
  const { tr } = useTr();
  const pathname = usePathname();
  return (
    <nav aria-label={tr("Portal")} className="flex gap-1">
      {items.map((i) => {
        const active = i.href === root ? pathname === root : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap", active ? "border-navy-600 text-navy-800" : "border-transparent text-muted hover:text-navy-800")}>
            {tr(i.label)}
          </Link>
        );
      })}
    </nav>
  );
}
