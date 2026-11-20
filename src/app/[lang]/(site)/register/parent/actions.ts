"use server";

import { localizeState } from "@/i18n/server";
import { keepValues, type FormValues } from "@/lib/form-values";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestInfo } from "@/lib/server/request";
import { normalisePhone } from "@/lib/student-import";

export type ParentSignupState = { values?: FormValues; error?: string; fieldErrors?: Record<string, string> } | undefined;

const signupSchema = z
  .object({
    name: z.string().trim().min(3, "Enter your full name.").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    phone: z.string().trim().max(20),
    password: z.string().max(128),
    confirm: z.string().max(128),
    consent: z.literal("on", { message: "Please confirm to continue." }),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords don't match.", path: ["confirm"] });

async function run(_prev: ParentSignupState, formData: FormData): Promise<ParentSignupState> {
  if (String(formData.get("website") ?? "")) return { values: keepValues(formData), error: "Please try again." };
  const parsed = signupSchema.safeParse(Object.fromEntries(["name", "email", "phone", "password", "confirm", "consent"].map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { values: keepValues(formData), error: "Please check the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const v = parsed.data;
  const phone = normalisePhone(v.phone);
  if (!phone) return { values: keepValues(formData), fieldErrors: { phone: "Enter a valid mobile number, e.g. 0300 1234567." } };
  const problem = passwordProblem(v.password, { email: v.email, name: v.name });
  if (problem) return { values: keepValues(formData), fieldErrors: { password: problem } };

  const { ip } = await requestInfo();
  if (!(await rateLimit(`parent-signup:${ip ?? "unknown"}`, 5, 60 * 60))) return { values: keepValues(formData), error: "Too many sign-ups from this connection. Please try again in an hour." };
  if (await db.query.users.findFirst({ where: sql`lower(${schema.users.email}) = ${v.email}` })) {
    return { values: keepValues(formData), fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
  }
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.key, "parent") });
  if (!role) return { values: keepValues(formData), error: "Sign-up is not available right now. Please contact EEA." };

  const passwordHash = await hashPassword(v.password);
  const user = await db.transaction(async (tx) => {
    const [u] = await tx.insert(schema.users).values({ email: v.email, name: v.name, phone, kind: "parent", passwordHash }).returning({ id: schema.users.id });
    await tx.insert(schema.userRoles).values({ userId: u.id, roleId: role.id });
    return u;
  });
  await audit({ actorUserId: user.id, action: "parent.registered", entityType: "user", entityId: user.id });
  await createSession(user.id, { mfaVerified: false, staff: false });
  redirect("/parent?welcome=1");
}

export async function registerParentAction(prev: ParentSignupState, formData: FormData): Promise<ParentSignupState> {
  return localizeState(await run(prev, formData), formData);
}
