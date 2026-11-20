import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { can, requirePermission } from "@/lib/auth/dal";
import { Card, DateTime, EmptyState, PageHeader, Pill } from "@/components/admin/ui";
import { setEnquiryStatusAction } from "./actions";

export const metadata: Metadata = { title: "Enquiries" };
const statuses = { new: "New", in_progress: "In progress", closed: "Closed" } as const;
type Status = keyof typeof statuses;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePermission("enquiries.view");
  const sp = await searchParams;
  const filter = (sp.status && sp.status in statuses ? sp.status : "new") as Status;
  const rows = await db.select().from(schema.contactEnquiries).where(eq(schema.contactEnquiries.status, filter)).orderBy(desc(schema.contactEnquiries.createdAt)).limit(100);
  const manage = can(user, "enquiries.manage");

  return (
    <>
      <PageHeader title="Enquiries" description="Messages sent through the website contact form." />
      <nav className="mb-4 flex gap-2" aria-label="Filter by status">
        {(Object.keys(statuses) as Status[]).map((s) => (
          <Link key={s} href={`/admin/enquiries?status=${s}`} aria-current={s === filter ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${s === filter ? "bg-navy-600 text-white ring-navy-600" : "bg-white ring-line hover:bg-navy-50"}`}>
            {statuses[s]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <Card><EmptyState title={`No ${statuses[filter].toLowerCase()} enquiries`} /></Card>
      ) : (
        <div className="space-y-4">
          {rows.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-navy-900">{e.subject}</p>
                  <p className="text-sm text-muted">
                    {e.name} · <a href={`mailto:${e.email}`} className="text-navy-600 hover:underline">{e.email}</a>
                    {e.phone && <> · <a href={`tel:${e.phone}`} className="text-navy-600 hover:underline">{e.phone}</a></>} · <Pill tone="blue">{e.audience}</Pill>
                  </p>
                </div>
                <p className="text-sm text-muted"><DateTime value={e.createdAt} /></p>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line text-ink">{e.message}</p>
              {manage && (
                <form action={setEnquiryStatusAction} className="mt-4 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  {(Object.keys(statuses) as Status[]).filter((s) => s !== e.status).map((s) => (
                    <button key={s} name="status" value={s} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-line hover:bg-navy-50">Mark {statuses[s].toLowerCase()}</button>
                  ))}
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
