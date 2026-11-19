import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { randomToken, sha256 } from "@/lib/server/crypto";
import { requestInfo } from "@/lib/server/request";

export const SESSION_COOKIE = "eea_session";
const STAFF_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const PORTAL_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const TOUCH_EVERY_MS = 5 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  kind: (typeof schema.userKind.enumValues)[number];
  mustChangePassword: boolean;
  totpEnabled: boolean;
  permissions: Set<string>;
  roles: { key: string; name: string; schoolId: string | null }[];
  isStaff: boolean;
  /** Student accounts: their student record. */
  studentId: string | null;
};

export type SessionState = { sessionId: string; mfaVerified: boolean; user: SessionUser };

export async function createSession(userId: string, opts: { mfaVerified: boolean; staff: boolean }) {
  const token = randomToken();
  const { ip, userAgent } = await requestInfo();
  const expiresAt = new Date(Date.now() + (opts.staff ? STAFF_TTL_MS : PORTAL_TTL_MS));
  await db.insert(schema.sessions).values({ id: sha256(token), userId, mfaVerified: opts.mfaVerified, expiresAt, ip, userAgent });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function markSessionMfaVerified(sessionId: string) {
  await db.update(schema.sessions).set({ mfaVerified: true }).where(eq(schema.sessions.id, sessionId));
}

async function loadUser(userId: string): Promise<SessionUser | null> {
  const user = await db.query.users.findFirst({ where: and(eq(schema.users.id, userId), eq(schema.users.status, "active")) });
  if (!user) return null;
  const rows = await db
    .select({ key: schema.roles.key, name: schema.roles.name, schoolId: schema.userRoles.schoolId, permission: schema.rolePermissions.permissionKey })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
    .leftJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));
  const permissions = new Set(rows.map((r) => r.permission).filter((p): p is string => Boolean(p)));
  const roles = [...new Map(rows.map((r) => [`${r.key}:${r.schoolId}`, { key: r.key, name: r.name, schoolId: r.schoolId }])).values()];
  return {
    id: user.id,
    email: user.email ?? user.username ?? "",
    name: user.name,
    kind: user.kind,
    mustChangePassword: user.mustChangePassword,
    totpEnabled: Boolean(user.totpEnabledAt),
    permissions,
    roles,
    isStaff: user.kind === "staff",
    studentId: user.studentId,
  };
}

/** Reads and validates the session cookie. Returns null when signed out or expired. */
export async function readSession(): Promise<SessionState | null> {
  await connection(); // always per request; never prerendered
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const id = sha256(token);
  const session = await db.query.sessions.findFirst({ where: and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())) });
  if (!session) return null;
  const user = await loadUser(session.userId);
  if (!user) return null;
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await db.update(schema.sessions).set({ lastSeenAt: new Date() }).where(eq(schema.sessions.id, id));
  }
  return { sessionId: id, mfaVerified: session.mfaVerified, user };
}

export async function destroyCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** Signs a user out everywhere, e.g. after a password change or when disabled. */
export async function destroyUserSessions(userId: string, exceptSessionId?: string) {
  await db
    .delete(schema.sessions)
    .where(exceptSessionId ? and(eq(schema.sessions.userId, userId), sql`${schema.sessions.id} <> ${exceptSessionId}`) : eq(schema.sessions.userId, userId));
}

export async function purgeExpiredSessions() {
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
}
