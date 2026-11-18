/**
 * The permission catalogue. Code checks permissions, never role names, so the
 * Super Administrator can change what each role may do from /admin/roles.
 * Adding a permission here + running `npm run db:seed` makes it available.
 */

export const PERMISSIONS = {
  "dashboard.view": { module: "Dashboard", description: "See the admin dashboard" },

  "schools.view": { module: "Schools", description: "View schools and campuses" },
  "schools.manage": { module: "Schools", description: "Create and edit schools and campuses" },
  "schools.approve": { module: "Schools", description: "Approve or reject school registrations" },

  "students.view": { module: "Students", description: "View student records" },
  "students.manage": { module: "Students", description: "Create, edit and merge student records" },

  "competitions.view": { module: "Competitions", description: "View competitions" },
  "competitions.manage": { module: "Competitions", description: "Create and edit competitions, dates and fees" },
  "competitions.publish": { module: "Competitions", description: "Publish and archive competitions" },

  "registrations.view": { module: "Registrations", description: "View registrations" },
  "registrations.manage": { module: "Registrations", description: "Edit registrations and imports" },

  "questions.view": { module: "Question bank", description: "View questions" },
  "questions.manage": { module: "Question bank", description: "Write and edit questions" },
  "questions.approve": { module: "Question bank", description: "Approve questions for use in papers" },

  "exams.view": { module: "Examinations", description: "View papers and exam schedules" },
  "exams.manage": { module: "Examinations", description: "Generate papers and manage exam sessions" },

  "results.view": { module: "Results", description: "View results" },
  "results.manage": { module: "Results", description: "Calculate and correct results" },
  "results.approve": { module: "Results", description: "Approve results (second person)" },
  "results.publish": { module: "Results", description: "Publish or schedule results" },

  "certificates.view": { module: "Certificates", description: "View certificates" },
  "certificates.manage": { module: "Certificates", description: "Design templates and issue certificates" },

  "awards.view": { module: "Awards", description: "View awards and dispatches" },
  "awards.manage": { module: "Awards", description: "Manage award rules and dispatch" },

  "finance.view": { module: "Finance", description: "View payments and reports" },
  "finance.manage": { module: "Finance", description: "Verify payments, fees and discounts" },
  "finance.refund": { module: "Finance", description: "Issue refunds" },

  "communication.view": { module: "Communication", description: "View messages and templates" },
  "communication.send": { module: "Communication", description: "Send emails, SMS and WhatsApp" },

  "cms.view": { module: "Website", description: "View website content" },
  "cms.manage": { module: "Website", description: "Edit website content" },
  "cms.publish": { module: "Website", description: "Publish website content" },

  "enquiries.view": { module: "Enquiries", description: "Read contact form enquiries" },
  "enquiries.manage": { module: "Enquiries", description: "Update enquiry status" },

  "reports.view": { module: "Reports", description: "View reports and analytics" },
  "reports.export": { module: "Reports", description: "Export data to Excel or PDF" },

  "users.view": { module: "Users", description: "View staff and portal users" },
  "users.manage": { module: "Users", description: "Create users, reset passwords, assign roles" },
  "roles.manage": { module: "Users", description: "Change what each role is allowed to do" },

  "settings.manage": { module: "Settings", description: "Change system settings" },
  "audit.view": { module: "Audit", description: "View the audit log" },

  "portal.school": { module: "Portals", description: "Use the school portal" },
  "portal.student": { module: "Portals", description: "Use the student portal" },
  "portal.parent": { module: "Portals", description: "Use the parent portal" },
} as const satisfies Record<string, { module: string; description: string }>;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

const view = (...modules: string[]) => modules.map((m) => `${m}.view` as Permission);

export type RoleDef = {
  key: string;
  name: string;
  description: string;
  scope: "global" | "school" | "self";
  /** Staff roles require two-factor login. */
  staff: boolean;
  permissions: Permission[];
};

export const DEFAULT_ROLES: RoleDef[] = [
  {
    key: "super_admin",
    name: "Super Administrator",
    description: "Full access, including roles, settings and the audit log.",
    scope: "global",
    staff: true,
    permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith("portal.")),
  },
  {
    key: "admin",
    name: "Administrator",
    description: "All operations except role permissions and system settings.",
    scope: "global",
    staff: true,
    permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith("portal.") && !["roles.manage", "settings.manage"].includes(p)),
  },
  {
    key: "competition_manager",
    name: "Competition Manager",
    description: "Creates and publishes competitions, dates, fees and syllabi.",
    scope: "global",
    staff: true,
    permissions: ["dashboard.view", "competitions.view", "competitions.manage", "competitions.publish", "cms.view", ...view("schools", "registrations")],
  },
  {
    key: "exam_manager",
    name: "Examination Manager",
    description: "Question bank, paper generation and exam sessions.",
    scope: "global",
    staff: true,
    permissions: ["dashboard.view", "questions.view", "questions.manage", "questions.approve", "exams.view", "exams.manage", ...view("competitions", "registrations")],
  },
  {
    key: "finance_manager",
    name: "Finance Manager",
    description: "Fees, payment verification, refunds and financial reports.",
    scope: "global",
    staff: true,
    permissions: ["dashboard.view", "finance.view", "finance.manage", "finance.refund", "reports.view", "reports.export", ...view("schools", "registrations")],
  },
  {
    key: "result_manager",
    name: "Result Manager",
    description: "Calculates, reviews, approves and publishes results.",
    scope: "global",
    staff: true,
    permissions: ["dashboard.view", "results.view", "results.manage", "results.approve", "results.publish", ...view("competitions", "schools", "students", "exams")],
  },
  {
    key: "certificate_manager",
    name: "Certificate Manager",
    description: "Certificate templates, issuing, awards and dispatch.",
    scope: "global",
    staff: true,
    permissions: ["dashboard.view", "certificates.view", "certificates.manage", "awards.view", "awards.manage", ...view("results", "schools")],
  },
  {
    key: "school_coordinator",
    name: "School Coordinator",
    description: "Manages one school: students, registrations, payments and results.",
    scope: "school",
    staff: false,
    permissions: ["portal.school"],
  },
  {
    key: "teacher",
    name: "Teacher",
    description: "Views their school's students, schedules and results.",
    scope: "school",
    staff: false,
    permissions: ["portal.school"],
  },
  { key: "student", name: "Student", description: "Takes exams and sees their own results.", scope: "self", staff: false, permissions: ["portal.student"] },
  { key: "parent", name: "Parent", description: "Sees their linked children's schedules and results.", scope: "self", staff: false, permissions: ["portal.parent"] },
];

/** Permissions that make a user "staff" and so require two-factor login. */
export const isStaffPermissionSet = (perms: Iterable<string>) => [...perms].some((p) => !p.startsWith("portal."));
