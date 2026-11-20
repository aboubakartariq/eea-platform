import type { Metadata } from "next";
import { requireParent } from "@/lib/auth/family";
import { PortalShell, UserChip } from "@/components/portal/portal-shell";
import { getTr } from "@/i18n/app-server";
import { N_ } from "@/i18n/tr";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: { default: tr("Parent portal"), template: "%s | EEA Parents" }, robots: { index: false, follow: false } };
}

async function Badge() {
  const { tr } = await getTr();
  const user = await requireParent();
  return <UserChip name={user.name} subtitle={tr("Parent account")} />;
}

const nav = [
  { href: "/parent", label: N_("My children") },
  { href: "/parent/register", label: N_("Register for competitions") },
  { href: "/parent/registrations", label: N_("Registrations") },
];

export default async function ParentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { tr } = await getTr();
  return <PortalShell label={tr("Parent Portal")} root="/parent" nav={nav} badge={<Badge />}>{children}</PortalShell>;
}
