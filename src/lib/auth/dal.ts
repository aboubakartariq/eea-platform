import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession, type SessionState, type SessionUser } from "./session";
import type { Permission } from "./permissions";

/**
 * Data Access Layer: the only place pages and actions get the current user.
 * Every check runs on the server; the browser is never trusted.
 */
export const getSession = cache(readSession);

/** Where a signed-in user must go before anything else, or null if they are fully signed in. */
export function pendingStep(s: SessionState): string | null {
  if (s.user.totpEnabled && !s.mfaVerified) return "/login/verify";
  if (s.user.mustChangePassword) return "/account/password";
  if (s.user.isStaff && !s.user.totpEnabled) return "/account/two-factor/setup";
  return null;
}

/** A fully signed-in user (password changed, two-factor passed). */
export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  const step = pendingStep(s);
  if (step) redirect(step);
  return s.user;
}

export const can = (user: SessionUser, permission: Permission) => user.permissions.has(permission);

/** For admin pages and actions. Redirects when the user lacks the permission. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isStaff) redirect("/login");
  if (!can(user, permission)) redirect(`/admin/no-access?need=${encodeURIComponent(permission)}`);
  return user;
}

/** For server actions that should fail with an error message rather than redirect. */
export async function assertPermission(permission: Permission): Promise<SessionUser> {
  const s = await getSession();
  if (!s || pendingStep(s) || !s.user.isStaff || !can(s.user, permission)) {
    throw new Error("You are not allowed to do this.");
  }
  return s.user;
}

/** Where a user lands after signing in. */
export function homeFor(user: SessionUser) {
  if (user.isStaff) return "/admin";
  if (user.permissions.has("portal.school")) return "/school";
  if (user.permissions.has("portal.parent")) return "/parent";
  return "/student";
}
