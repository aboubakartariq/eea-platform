"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { audit } from "@/lib/server/audit";
import { decrypt } from "@/lib/server/crypto";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestInfo } from "@/lib/server/request";
import { getSession, homeFor, pendingStep } from "./dal";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { createSession, destroyCurrentSession, destroyUserSessions, markSessionMfaVerified } from "./session";
import { checkTotp } from "./totp";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: string } | undefined;

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const GENERIC_LOGIN_ERROR = "That email and password don't match. Check them and try again.";

let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("timing-equaliser-not-a-real-password"));

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const { email, password } = parsed.data;
  const { ip } = await requestInfo();

  const allowed = (await rateLimit(`login:ip:${ip ?? "unknown"}`, 30, 15 * 60)) && (await rateLimit(`login:email:${email}`, 10, 15 * 60));
  if (!allowed) return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };

  const user = await db.query.users.findFirst({ where: sql`lower(${schema.users.email}) = ${email}` });
  if (user?.status === "pending" && user.passwordHash && (await verifyPassword(user.passwordHash, password))) {
    return { error: "Your school's registration is still being reviewed. You can sign in as soon as EEA approves it." };
  }
  if (!user || user.status !== "active" || !user.passwordHash) {
    await verifyPassword(await getDummyHash(), password); // keep timing similar for unknown emails
    await audit({ action: "login.failed", entityType: "user", entityId: user?.id, after: { email, reason: user ? user.status : "unknown_email" } });
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: `This account is locked after too many failed attempts. Try again after ${LOCK_MINUTES} minutes.` };
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED;
    await db
      .update(schema.users)
      .set({ failedLoginCount: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil })
      .where(eq(schema.users.id, user.id));
    await audit({ actorUserId: user.id, action: lock ? "login.locked" : "login.failed", entityType: "user", entityId: user.id });
    return { error: lock ? `Too many failed attempts. This account is locked for ${LOCK_MINUTES} minutes.` : GENERIC_LOGIN_ERROR };
  }

  await db.update(schema.users).set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id, { mfaVerified: false, staff: user.kind === "staff" });
  await audit({ actorUserId: user.id, action: "login.password_ok", entityType: "user", entityId: user.id });

  if (user.totpEnabledAt) redirect("/login/verify");
  if (user.mustChangePassword) redirect("/account/password");
  if (user.kind === "staff") redirect("/account/two-factor/setup");
  redirect(user.kind === "school" ? "/school" : user.kind === "parent" ? "/parent" : "/student");
}

export async function verifyTotpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s) redirect("/login");
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, s.user.id) });
  if (!user?.totpSecretEnc || !user.totpEnabledAt) redirect("/login");
  if (!(await rateLimit(`totp:${user.id}`, 8, 10 * 60))) return { error: "Too many attempts. Please wait 10 minutes." };

  const step = await checkTotp(decrypt(user.totpSecretEnc), String(formData.get("code") ?? ""), user.totpLastStep);
  if (step === null) {
    await audit({ actorUserId: user.id, action: "login.totp_failed", entityType: "user", entityId: user.id });
    return { error: "That code isn't right. Enter the current 6-digit code from your authenticator app." };
  }
  await db.update(schema.users).set({ totpLastStep: step }).where(eq(schema.users.id, user.id));
  await markSessionMfaVerified(s.sessionId);
  await audit({ actorUserId: user.id, action: "login.success", entityType: "user", entityId: user.id });
  const next = pendingStep({ ...s, mfaVerified: true });
  redirect(next ?? homeFor(s.user));
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password.").max(128),
    password: z.string().max(128),
    confirm: z.string().max(128),
  })
  .refine((v) => v.password === v.confirm, { message: "The two new passwords don't match.", path: ["confirm"] });

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.user.totpEnabled && !s.mfaVerified) redirect("/login/verify");

  const parsed = passwordSchema.safeParse({ current: formData.get("current"), password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const { current, password } = parsed.data;

  const problem = passwordProblem(password, { email: s.user.email });
  if (problem) return { fieldErrors: { password: problem } };
  if (!(await rateLimit(`pwchange:${s.user.id}`, 10, 15 * 60))) return { error: "Too many attempts. Please wait 15 minutes." };

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, s.user.id) });
  if (!user || !(await verifyPassword(user.passwordHash, current))) return { fieldErrors: { current: "Your current password isn't right." } };
  if (await verifyPassword(user.passwordHash, password)) return { fieldErrors: { password: "Choose a password different from your current one." } };

  await db.update(schema.users).set({ passwordHash: await hashPassword(password), mustChangePassword: false }).where(eq(schema.users.id, user.id));
  await destroyUserSessions(user.id, s.sessionId);
  await audit({ actorUserId: user.id, action: "user.password_changed", entityType: "user", entityId: user.id });

  const next = pendingStep({ ...s, user: { ...s.user, mustChangePassword: false } });
  redirect(next ?? homeFor(s.user));
}

export async function confirmTotpSetupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s) redirect("/login");
  const user = await db.query.users.findFirst({ where: and(eq(schema.users.id, s.user.id), isNull(schema.users.totpEnabledAt)) });
  if (!user?.totpSecretEnc) redirect(homeFor(s.user));
  if (!(await rateLimit(`totp-setup:${user.id}`, 10, 10 * 60))) return { error: "Too many attempts. Please wait 10 minutes." };

  const step = await checkTotp(decrypt(user.totpSecretEnc), String(formData.get("code") ?? ""), null);
  if (step === null) return { error: "That code isn't right. Check your phone's clock and enter the current code." };

  await db.update(schema.users).set({ totpEnabledAt: new Date(), totpLastStep: step }).where(eq(schema.users.id, user.id));
  await markSessionMfaVerified(s.sessionId);
  await audit({ actorUserId: user.id, action: "user.2fa_enabled", entityType: "user", entityId: user.id });
  redirect(homeFor(s.user));
}

export async function logoutAction() {
  const s = await getSession();
  await destroyCurrentSession();
  if (s) await audit({ actorUserId: s.user.id, action: "logout", entityType: "user", entityId: s.user.id });
  redirect("/login");
}
