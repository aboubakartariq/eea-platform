import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/family";
import { PortalShell, UserChip } from "@/components/portal/portal-shell";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: { default: tr("Student portal"), template: "%s | EEA Students" }, robots: { index: false, follow: false } };
}

async function Badge() {
  const { student } = await requireStudent();
  return <UserChip name={student.firstName} subtitle={student.code} />;
}

export default async function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { tr } = await getTr();
  return <PortalShell label={tr("Student Portal")} root="/student" nav={[{ href: "/student", label: tr("My competitions") }]} badge={<Badge />}>{children}</PortalShell>;
}
