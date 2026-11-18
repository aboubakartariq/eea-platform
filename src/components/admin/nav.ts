import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  permission: Permission;
  /** Built in a later phase: shown greyed out, not as a link. */
  phase?: number;
};

export const adminNav: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: "LayoutDashboard", permission: "dashboard.view" }],
  },
  {
    group: "Operations",
    items: [
      { label: "Schools", href: "/admin/schools", icon: "School", permission: "schools.view", phase: 4 },
      { label: "Students", href: "/admin/students", icon: "GraduationCap", permission: "students.view", phase: 4 },
      { label: "Competitions", href: "/admin/competitions", icon: "Trophy", permission: "competitions.view", phase: 4 },
      { label: "Registrations", href: "/admin/registrations", icon: "ClipboardList", permission: "registrations.view", phase: 4 },
      { label: "Question bank", href: "/admin/questions", icon: "Library", permission: "questions.view", phase: 5 },
      { label: "Examinations", href: "/admin/exams", icon: "FileCheck2", permission: "exams.view", phase: 5 },
      { label: "Results", href: "/admin/results", icon: "ListOrdered", permission: "results.view", phase: 6 },
      { label: "Certificates", href: "/admin/certificates", icon: "BadgeCheck", permission: "certificates.view", phase: 6 },
      { label: "Awards", href: "/admin/awards", icon: "Medal", permission: "awards.view", phase: 6 },
    ],
  },
  {
    group: "Business",
    items: [
      { label: "Finance", href: "/admin/finance", icon: "Wallet", permission: "finance.view", phase: 7 },
      { label: "Communication", href: "/admin/communication", icon: "Send", permission: "communication.view", phase: 7 },
      { label: "Enquiries", href: "/admin/enquiries", icon: "Inbox", permission: "enquiries.view" },
      { label: "Website", href: "/admin/website", icon: "PanelsTopLeft", permission: "cms.view", phase: 7 },
      { label: "Reports", href: "/admin/reports", icon: "ChartColumn", permission: "reports.view", phase: 8 },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: "Users", permission: "users.view" },
      { label: "Roles", href: "/admin/roles", icon: "KeyRound", permission: "roles.manage" },
      { label: "Settings", href: "/admin/settings", icon: "Settings", permission: "settings.manage", phase: 7 },
      { label: "Audit log", href: "/admin/audit", icon: "ScrollText", permission: "audit.view" },
    ],
  },
];
