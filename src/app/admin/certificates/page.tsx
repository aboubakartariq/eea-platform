import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { buttonClass } from "@/components/ui/button";
import { Card, DateTime, EmptyState, PageHeader, Pill, td, th } from "@/components/admin/ui";
import { RevokeButton } from "./forms";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePermission("certificates.view");
  const q = ((await searchParams).q ?? "").trim().slice(0, 60);
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const [comps, certs] = await Promise.all([
    db.select({ id: schema.competitions.id, name: schema.competitions.name, tpl: schema.certificateTemplates.updatedAt }).from(schema.competitions).leftJoin(schema.certificateTemplates, eq(schema.certificateTemplates.competitionId, schema.competitions.id)).orderBy(asc(schema.competitions.sortOrder)),
    db
      .select({ id: schema.certificates.id, serial: schema.certificates.serial, name: schema.certificates.studentName, award: schema.certificates.awardLabel, school: schema.certificates.schoolName, issuedAt: schema.certificates.issuedAt, revokedAt: schema.certificates.revokedAt, competition: schema.competitions.name })
      .from(schema.certificates)
      .innerJoin(schema.competitions, eq(schema.competitions.id, schema.certificates.competitionId))
      .where(q ? or(ilike(schema.certificates.serial, like), ilike(schema.certificates.studentName, like)) : undefined)
      .orderBy(desc(schema.certificates.issuedAt), asc(schema.certificates.serial))
      .limit(200),
  ]);
  const manage = can(user, "certificates.manage");
  return (
    <>
      <PageHeader title="Certificates" description="Certificates are issued automatically when results are published. Each has a QR code linking to a public page that confirms it is genuine." />
      <Card title="Certificate design per competition" className="mb-6">
        <ul className="divide-y divide-line">
          {comps.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="flex items-center gap-3">{c.tpl ? <Pill tone="green">Custom wording</Pill> : <Pill>Standard wording</Pill>}{manage && <Link href={`/admin/certificates/template/${c.id}`} className={buttonClass("outline", "sm")}>Edit</Link>}</span>
            </li>
          ))}
        </ul>
      </Card>
      <form className="mb-4 flex gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Certificate number or student name" aria-label="Search certificates" className="h-10 w-80 rounded-xl border border-line bg-white px-3 text-sm" />
        <button className={buttonClass("outline", "sm")}>Search</button>
      </form>
      <Card>
        {certs.length === 0 ? <EmptyState title={q ? "No certificates match" : "No certificates issued yet"}>They appear here when results are published.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface/60"><tr><th className={th}>Certificate</th><th className={th}>Student</th><th className={th}>Award</th><th className={th}>Issued</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {certs.map((c) => (
                  <tr key={c.id}>
                    <td className={td}><Link href={`/certificates/${c.id}`} target="_blank" className="font-mono text-xs font-semibold text-navy-700 hover:underline">{c.serial}</Link></td>
                    <td className={td}>{c.name}<p className="text-xs text-muted">{c.school ?? "Individual"}</p></td>
                    <td className={td}>{c.award}<p className="text-xs text-muted">{c.competition}</p></td>
                    <td className={`${td} text-muted`}><DateTime value={c.issuedAt} /></td>
                    <td className={td}>{c.revokedAt ? <Pill tone="red">Revoked</Pill> : <div className="flex items-center gap-3"><Pill tone="green">Valid</Pill>{manage && <RevokeButton id={c.id} />}</div>}</td>
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
