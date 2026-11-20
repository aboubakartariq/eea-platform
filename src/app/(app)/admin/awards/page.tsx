import type { Metadata } from "next";
import { asc, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { Card, EmptyState, PageHeader, Pill, StatCard, td, th } from "@/components/admin/ui";
import { DispatchForm } from "./dispatch-form";

export const metadata: Metadata = { title: "Awards" };
const TONE = { pending: "amber", packed: "blue", dispatched: "blue", delivered: "green" } as const;

export default async function AwardsAdmin() {
  const user = await requirePermission("awards.view");
  const rows = await db
    .select({
      id: schema.awardDispatches.id, status: schema.awardDispatches.status, items: schema.awardDispatches.items, address: schema.awardDispatches.address, courier: schema.awardDispatches.courier, tracking: schema.awardDispatches.tracking,
      competition: schema.competitions.name, school: schema.schools.name, schoolAddress: sql<string | null>`${schema.schools.address} || ', ' || ${schema.schools.city}`, parent: schema.users.name, parentPhone: schema.users.phone,
    })
    .from(schema.awardDispatches)
    .innerJoin(schema.resultSets, eq(schema.resultSets.id, schema.awardDispatches.resultSetId))
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.resultSets.competitionId))
    .leftJoin(schema.schools, eq(schema.schools.id, schema.awardDispatches.schoolId))
    .leftJoin(schema.users, eq(schema.users.id, schema.awardDispatches.guardianUserId))
    .where(ne(schema.resultSets.status, "withdrawn"))
    .orderBy(asc(schema.competitions.name), asc(schema.schools.name));
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const manage = can(user, "awards.manage");
  return (
    <>
      <PageHeader title="Awards" description="Medal parcels are created when results are published: one per school, and one per parent for individual entrants. Certificates are downloaded from the portals, so they are not posted." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="To pack" value={count("pending")} />
        <StatCard label="Packed" value={count("packed")} />
        <StatCard label="On the way" value={count("dispatched")} />
        <StatCard label="Delivered" value={count("delivered")} />
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState title="No award parcels yet">They appear when results with medals are published.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Recipient</th><th className={th}>Awards</th><th className={th}>Status</th><th className={th}>Delivery</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className={td}><p className="font-medium">{r.school ?? `Parent: ${r.parent}`}</p><p className="text-xs text-muted">{r.competition}{r.parentPhone && !r.school ? ` · ${r.parentPhone}` : ""}</p></td>
                    <td className={td}>{r.items.map((i) => `${i.count} × ${i.label}`).join(", ")}</td>
                    <td className={td}><Pill tone={TONE[r.status]}>{r.status}</Pill></td>
                    <td className={td}>{manage ? <DispatchForm d={{ id: r.id, status: r.status, address: r.address ?? r.schoolAddress ?? "", courier: r.courier ?? "", tracking: r.tracking ?? "" }} /> : <span className="text-muted">{r.courier ? `${r.courier} ${r.tracking}` : "—"}</span>}</td>
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
