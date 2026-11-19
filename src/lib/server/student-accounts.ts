import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { hashPassword } from "@/lib/auth/password";
import { destroyUserSessions } from "@/lib/auth/session";

/**
 * Creates the student's login, or resets its password if it exists.
 * The username is the student ID (e.g. EEA-S-100245).
 */
export async function setStudentLogin(student: { id: string; code: string; firstName: string; lastName: string }, password: string) {
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.key, "student") });
  if (!role) throw new Error("Student role missing; run the seed.");
  const passwordHash = await hashPassword(password);
  const existing = await db.query.users.findFirst({ where: eq(schema.users.studentId, student.id) });
  if (existing) {
    await db.update(schema.users).set({ passwordHash, status: "active", failedLoginCount: 0, lockedUntil: null }).where(eq(schema.users.id, existing.id));
    await destroyUserSessions(existing.id);
    return { userId: existing.id, created: false };
  }
  const userId = await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(schema.users)
      .values({ username: student.code, name: `${student.firstName} ${student.lastName}`, kind: "student", passwordHash, studentId: student.id })
      .returning({ id: schema.users.id });
    await tx.insert(schema.userRoles).values({ userId: u.id, roleId: role.id });
    return u.id;
  });
  return { userId, created: true };
}
