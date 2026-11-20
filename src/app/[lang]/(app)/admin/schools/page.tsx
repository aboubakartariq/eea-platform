import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq, ilike, or, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { Card, DateTime, EmptyState, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { getTr } from "@/i18n/app-server";
import { N_ } from "@/i18n/tr";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Schools") };
}
const tabs = { pending: N_("Awaiting approval"), approved: N_("Approved"), rejected: N_("Rejected"), suspended: N_("Suspended") } as const;
type Tab = keyof typeof tabs;

export default async function SchoolsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { tr } = await getTr();
  await requirePermission("schools.view");
  const sp = await searchParams;
  const status = (sp.status && sp.status in tabs ? sp.status : "pending") as Tab;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const rows = await db
    .select({ id: schema.schools.id, name: schema.schools.name, code: schema.schools.code, city: schema.schools.city, principal: schema.schools.principalName, createdAt: schema.schools.createdAt })
    .from(schema.schools)
    .where(and(eq(schema.schools.status, status), q ? or(ilike(schema.schools.name, `%${q}%`), ilike(schema.schools.city, `%${q}%`), ilike(schema.schools.code, `%${q}%`)) : undefined))
    .orderBy(desc(schema.schools.createdAt))
    .limit(200);
  const counts = await db.select({ s: schema.schools.status, n: count() }).from(schema.schools).groupBy(schema.schools.status);
  const cn = new Map(counts.map((c) => [c.s, c.n]));
  const studentCounts = await db.select({ schoolId: schema.students.schoolId, n: count() }).from(schema.students).groupBy(schema.students.schoolId);
  const sc = new Map(studentCounts.map((c) => [c.schoolId, c.n]));

  return (
    <>
      <PageHeader title={tr("Schools")} description={tr("Schools register on the website and appear here for approval. Approving issues a school ID and activates the coordinator account.")} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(tabs) as Tab[]).map((t) => (
          <Link key={t} href={`/admin/schools?status=${t}`} aria-current={t === status ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${t === status ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line hover:bg-navy-50"}`}>
            {tr(tabs[t])} <span className="ms-1 opacity-70">{cn.get(t) ?? 0}</span>
          </Link>
        ))}
        <form className="ms-auto flex gap-2" role="search">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="q" className="sr-only">{tr("Search schools")}</label>
          <input id="q" name="q" defaultValue={q} placeholder={tr("Name, city or school ID")} className="h-10 w-60 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-navy-600" />
        </form>
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState title={tr("No schools here")} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>{tr("School")}</th><th className={th}>{tr("City")}</th><th className={th}>{tr("School ID")}</th><th className={th}>{tr("Students")}</th><th className={th}>{tr("Registered on")}</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/50">
                    <td className={td}><Link href={`/admin/schools/${s.id}`} className="font-semibold text-navy-900 hover:underline">{s.name}</Link><p className="text-xs text-muted">{tr("Principal: {principal}", { principal: s.principal })}</p></td>
                    <td className={`${td} text-muted`}>{s.city}</td>
                    <td className={td}>{s.code ? <span className="font-mono text-xs">{s.code}</span> : <Pill tone="amber">{tr("Not issued")}</Pill>}</td>
                    <td className={`${td} tabular-nums`}>{sc.get(s.id) ?? 0}</td>
                    <td className={`${td} text-muted`}><DateTime value={s.createdAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
