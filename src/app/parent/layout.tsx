import type { Metadata } from "next";
import { requireParent } from "@/lib/auth/family";
import { PortalShell, UserChip } from "@/components/portal/portal-shell";

export const metadata: Metadata = { title: { default: "Parent portal", template: "%s | EEA Parents" }, robots: { index: false, follow: false } };

async function Badge() {
  const user = await requireParent();
  return <UserChip name={user.name} subtitle="Parent account" />;
}

const nav = [
  { href: "/parent", label: "My children" },
  { href: "/parent/register", label: "Register for competitions" },
  { href: "/parent/registrations", label: "Registrations" },
];

export default function ParentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PortalShell label="Parent Portal" root="/parent" nav={nav} badge={<Badge />}>{children}</PortalShell>;
}
