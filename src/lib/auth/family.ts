import "server-only";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { homeFor, requireUser } from "./dal";

/** For parent portal pages and actions. */
export async function requireParent() {
  const user = await requireUser();
  if (user.kind !== "parent" || !user.permissions.has("portal.parent")) redirect(homeFor(user));
  return user;
}

/** A child linked to the signed-in parent, or 404. Every parent query about a child goes through this. */
export async function requireOwnChild(studentId: string) {
  const user = await requireParent();
  const [row] = await db
    .select({ student: schema.students })
    .from(schema.studentGuardians)
    .innerJoin(schema.students, eq(schema.students.id, schema.studentGuardians.studentId))
    .where(and(eq(schema.studentGuardians.userId, user.id), eq(schema.studentGuardians.studentId, studentId)));
  if (!row) notFound();
  return { user, student: row.student };
}

/** For student portal pages. */
export async function requireStudent() {
  const user = await requireUser();
  if (user.kind !== "student" || !user.studentId || !user.permissions.has("portal.student")) redirect(homeFor(user));
  const student = await db.query.students.findFirst({ where: eq(schema.students.id, user.studentId) });
  if (!student || student.archived) redirect("/login");
  return { user, student };
}
