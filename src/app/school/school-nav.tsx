"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/school", label: "Overview" },
  { href: "/school/students", label: "Students" },
  { href: "/school/register", label: "Register for competitions" },
  { href: "/school/registrations", label: "Registrations" },
];

export function SchoolNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="School portal" className="flex gap-1">
      {items.map((i) => {
        const active = i.href === "/school" ? pathname === "/school" : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap", active ? "border-navy-600 text-navy-800" : "border-transparent text-muted hover:text-navy-800")}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
