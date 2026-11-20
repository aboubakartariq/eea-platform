"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck, ChartColumn, ClipboardList, FileCheck2, GraduationCap, Inbox, KeyRound, LayoutDashboard, Library,
  ListOrdered, Medal, PanelsTopLeft, School, ScrollText, Send, Settings, Trophy, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { AdminNavItem } from "./nav";
import { cn } from "@/lib/utils";
import { useTr } from "@/i18n/app-client";

const icons: Record<string, LucideIcon> = {
  BadgeCheck, ChartColumn, ClipboardList, FileCheck2, GraduationCap, Inbox, KeyRound, LayoutDashboard, Library,
  ListOrdered, Medal, PanelsTopLeft, School, ScrollText, Send, Settings, Trophy, Users, Wallet,
};

export function SidebarNav({ groups, onNavigate }: { groups: { group: string; items: AdminNavItem[] }[]; onNavigate?: () => void }) {
  const { tr, msg } = useTr();
  const pathname = usePathname();
  return (
    <nav aria-label={tr("Admin")} className="space-y-6">
      {groups.map((g) => (
        <div key={msg(g.group)}>
          <p className="px-3 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{msg(g.group)}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((item) => {
              const Icon = icons[item.icon] ?? LayoutDashboard;
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              if (item.phase) {
                return (
                  <li key={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted/70" title={tr("Arrives in Phase {phase}", { phase: item.phase })}>
                    <Icon className="size-[18px]" aria-hidden />
                    <span className="flex-1">{msg(item.label)}</span>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">{tr("Phase {phase}", { phase: item.phase })}</span>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-navy-600 text-white" : "text-ink hover:bg-navy-50 hover:text-navy-800",
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    {msg(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
