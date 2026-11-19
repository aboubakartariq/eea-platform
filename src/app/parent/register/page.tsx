import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth/family";
import { getOpenCompetitions, getPublishedCompetitions } from "@/lib/competitions";
import { gradeName, gradesLabel, isEligible } from "@/lib/competition-types";
import { CompetitionIcon } from "@/components/competition-card";
import { Card, PageHeader } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/utils";
import { RegisterChildrenForm } from "./form";

export const metadata: Metadata = { title: "Register for competitions" };

export default async function ParentRegister() {
  const user = await requireParent();
  const [open, all, children] = await Promise.all([
    getOpenCompetitions(),
    getPublishedCompetitions(),
    db.select({ id: schema.students.id, firstName: schema.students.firstName, grade: schema.students.grade }).from(schema.studentGuardians).innerJoin(schema.students, eq(schema.students.id, schema.studentGuardians.studentId)).where(eq(schema.studentGuardians.userId, user.id)).orderBy(asc(schema.students.firstName)),
  ]);
  const taken = children.length
    ? await db.select({ studentId: schema.registrationItems.studentId, competitionId: schema.registrationItems.competitionId }).from(schema.registrationItems).innerJoin(schema.studentGuardians, eq(schema.studentGuardians.studentId, schema.registrationItems.studentId)).where(eq(schema.studentGuardians.userId, user.id))
    : [];
  const online = open.filter((c) => c.modes.includes("online"));
  const openIds = new Set(online.map((c) => c.id));

  return (
    <>
      <PageHeader title="Register for competitions" description="Individual entries are for online competitions, taken from home on a laptop, desktop or tablet." />
      {children.length === 0 ? (
        <Card className="p-6 text-sm text-muted">Add or link a child first. <Link href="/parent" className="font-semibold text-navy-600 underline">Go to My children</Link></Card>
      ) : online.length === 0 ? (
        <Card className="p-6 text-sm text-muted">No online competition is open for registration yet. EEA will publish dates soon.</Card>
      ) : (
        <div className="space-y-4">
          {online.map((c) => {
            const kids = children.map((k) => ({ ...k, eligible: isEligible(c, k.grade), registered: taken.some((t) => t.studentId === k.id && t.competitionId === c.id) }));
            return (
              <Card key={c.id} className="p-6">
                <div className="flex gap-4">
                  <CompetitionIcon c={c} />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{c.name}</h2>
                    <p className="text-sm text-muted">{gradesLabel(c)} · {formatPKR(c.feePkr!)} per child · exam {formatDate(c.examDate!)} · closes {formatDate(c.registrationCloses!)}</p>
                    <RegisterChildrenForm competitionId={c.id} fee={c.feePkr!} kids={kids.map((k) => ({ id: k.id, label: `${k.firstName} (${gradeName(k.grade)})`, disabled: !k.eligible || k.registered, note: k.registered ? "Registered" : !k.eligible ? "Grade not eligible" : "" }))} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {all.some((c) => !openIds.has(c.id)) && (
        <p className="mt-6 text-sm text-muted">Other competitions open later or are entered through schools: {all.filter((c) => !openIds.has(c.id)).map((c) => c.name).join(", ")}.</p>
      )}
    </>
  );
}
