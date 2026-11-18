"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import type { AdminNavItem } from "./nav";

export function MobileAdminNav({ groups }: { groups: { group: string; items: AdminNavItem[] }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-full hover:bg-navy-50">
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-white p-5">
          <SidebarNav groups={groups} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
