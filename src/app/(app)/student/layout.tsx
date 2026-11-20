import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/family";
import { PortalShell, UserChip } from "@/components/portal/portal-shell";

export const metadata: Metadata = { title: { default: "Student portal", template: "%s | EEA Students" }, robots: { index: false, follow: false } };

async function Badge() {
  const { student } = await requireStudent();
  return <UserChip name={student.firstName} subtitle={student.code} />;
}

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PortalShell label="Student Portal" root="/student" nav={[{ href: "/student", label: "My competitions" }]} badge={<Badge />}>{children}</PortalShell>;
}
