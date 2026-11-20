import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { PERMISSIONS, type Permission } from "@/lib/auth/permissions";
import { getTr } from "@/i18n/app-server";

export default async function NoAccess({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const { tr, msg } = await getTr();
  await requireUser();
  const { need } = await searchParams;
  const perm = need && need in PERMISSIONS ? PERMISSIONS[need as Permission] : null;
  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center ring-1 ring-line">
      <ShieldAlert className="mx-auto size-10 text-gold" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">{tr("You don't have access to this page")}</h1>
      {perm && <p className="mt-2 text-muted">{tr("It needs the permission:")}{" "}<strong className="text-navy-900">{msg(perm.description)}</strong>.</p>}
      <p className="mt-2 text-sm text-muted">{tr("Ask a Super Administrator to add it to one of your roles.")}</p>
      <Link href="/admin" className="mt-6 inline-block font-semibold text-navy-600 underline underline-offset-4">{tr("Back to dashboard")}</Link>
    </div>
  );
}
