import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { describeAction } from "@/lib/audit-labels";
import { Card, DateTime, EmptyState, PageHeader, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Audit log" };
const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("audit.view");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where = q ? or(ilike(schema.auditLogs.action, `%${q}%`), ilike(schema.users.name, `%${q}%`), ilike(schema.users.email, `%${q}%`), ilike(schema.auditLogs.entityId, `%${q}%`)) : undefined;

  const base = db.select({ n: count() }).from(schema.auditLogs).leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId));
  const [[{ n: total }], rows] = await Promise.all([
    where ? base.where(where) : base,
    db
      .select({ id: schema.auditLogs.id, action: schema.auditLogs.action, entityType: schema.auditLogs.entityType, entityId: schema.auditLogs.entityId, before: schema.auditLogs.before, after: schema.auditLogs.after, ip: schema.auditLogs.ip, createdAt: schema.auditLogs.createdAt, actor: schema.users.name, actorEmail: schema.users.email })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .where(where)
      .orderBy(desc(schema.auditLogs.id))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => `/admin/audit?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Audit log" description="Every sign-in, account change and sensitive action, with who did it, when and from where. Entries can't be edited or deleted." />
      <form className="mb-4 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search the audit log</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by action, person or record ID" className="h-11 w-full max-w-md rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-navy-600" />
        <button className="h-11 rounded-xl bg-navy-600 px-5 text-sm font-semibold text-white hover:bg-navy-700">Search</button>
      </form>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No entries found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>What</th><th className={th}>Details</th><th className={th}>IP</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className={`${td} text-muted`}><DateTime value={r.createdAt} /></td>
                    <td className={td}>{r.actor ? <><span className="font-medium text-navy-900">{r.actor}</span><p className="text-xs text-muted">{r.actorEmail}</p></> : <span className="text-muted">System or visitor</span>}</td>
                    <td className={td}>{describeAction(r.action)}<p className="font-mono text-[11px] text-muted">{r.action}</p></td>
                    <td className={`${td} max-w-sm`}>
                      {(r.before != null || r.after != null) ? (
                        <details><summary className="cursor-pointer text-xs font-semibold text-navy-600">{r.entityType} {r.entityId?.slice(0, 8)}</summary>
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-surface p-2 text-[11px] leading-snug">{JSON.stringify({ before: r.before, after: r.after }, null, 1)}</pre>
                        </details>
                      ) : <span className="text-xs text-muted">{r.entityType ? `${r.entityType} ${r.entityId?.slice(0, 8)}` : ""}</span>}
                    </td>
                    <td className={`${td} font-mono text-xs text-muted`}>{r.ip ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pages">
          <span className="text-muted">Page {page} of {pages} · {total} entries</span>
          <span className="flex gap-2">
            {page > 1 && <Link href={href(page - 1)} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-line hover:bg-navy-50">Newer</Link>}
            {page < pages && <Link href={href(page + 1)} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-line hover:bg-navy-50">Older</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
