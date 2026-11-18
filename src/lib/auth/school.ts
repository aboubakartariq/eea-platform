import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "./dal";

/**
 * For school portal pages and actions: the signed-in user's school.
 * Every school query must filter by the returned school id.
 */
export async function requireSchool() {
  const user = await requireUser();
  const role = user.roles.find((r) => r.schoolId && (r.key === "school_coordinator" || r.key === "teacher"));
  if (!role || !user.permissions.has("portal.school")) redirect(user.isStaff ? "/admin" : "/login");
  const school = await db.query.schools.findFirst({ where: eq(schema.schools.id, role.schoolId!) });
  if (!school || school.status !== "approved") redirect("/login");
  return { user, school, canManage: role.key === "school_coordinator" };
}

/** Same as requireSchool but throws instead of redirecting (for server actions). */
export async function assertSchoolManager() {
  const ctx = await requireSchool();
  if (!ctx.canManage) throw new Error("Only the school's coordinator can do this.");
  return ctx;
}
