"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTr } from "@/i18n/app-client";
import { N_ } from "@/i18n/tr";

const items = [
  { href: "/school", label: N_("Overview") },
  { href: "/school/students", label: N_("Students") },
  { href: "/school/register", label: N_("Register for competitions") },
  { href: "/school/registrations", label: N_("Registrations") },
  { href: "/school/results", label: N_("Results") },
];

export function SchoolNav() {
  const { tr } = useTr();
  const pathname = usePathname();
  return (
    <nav aria-label={tr("School portal")} className="flex gap-1">
      {items.map((i) => {
        const active = i.href === "/school" ? pathname === "/school" : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap", active ? "border-navy-600 text-navy-800" : "border-transparent text-muted hover:text-navy-800")}>
            {tr(i.label)}
          </Link>
        );
      })}
    </nav>
  );
}
