"use server";

import { localizeState } from "@/i18n/server";
import { keepValues, type FormValues } from "@/lib/form-values";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestInfo } from "@/lib/server/request";

export type SchoolSignupState = { values?: FormValues; ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

const phone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number.");

const signupSchema = z
  .object({
    schoolName: z.string().trim().min(3, "Enter the school's name.").max(200),
    principalName: z.string().trim().min(3, "Enter the principal's name.").max(120),
    officialEmail: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    schoolPhone: phone,
    address: z.string().trim().min(5, "Enter the school's address.").max(400),
    city: z.string().trim().min(2, "Enter the city.").max(80),
    coordinatorName: z.string().trim().min(3, "Enter the coordinator's name.").max(120),
    coordinatorEmail: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    coordinatorPhone: phone,
    password: z.string().max(128),
    confirm: z.string().max(128),
    consent: z.literal("on", { message: "Please confirm to continue." }),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords don't match.", path: ["confirm"] });

async function run(_prev: SchoolSignupState, formData: FormData): Promise<SchoolSignupState> {
  if (String(formData.get("website") ?? "")) return { ok: true }; // honeypot
  const keys = ["schoolName", "principalName", "officialEmail", "schoolPhone", "address", "city", "coordinatorName", "coordinatorEmail", "coordinatorPhone", "password", "confirm", "consent"];
  const parsed = signupSchema.safeParse(Object.fromEntries(keys.map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { values: keepValues(formData), error: "Please check the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const v = parsed.data;
  const problem = passwordProblem(v.password, { email: v.coordinatorEmail, name: v.coordinatorName });
  if (problem) return { values: keepValues(formData), fieldErrors: { password: problem } };

  const { ip } = await requestInfo();
  if (!(await rateLimit(`school-signup:${ip ?? "unknown"}`, 5, 60 * 60))) return { values: keepValues(formData), error: "Too many registrations from this connection. Please try again in an hour." };

  const existing = await db.query.users.findFirst({ where: sql`lower(${schema.users.email}) = ${v.coordinatorEmail}` });
  if (existing) return { values: keepValues(formData), fieldErrors: { coordinatorEmail: "An account with this email already exists. Sign in instead, or use another email." } };
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.key, "school_coordinator") });
  if (!role) return { values: keepValues(formData), error: "Registration is not available right now. Please contact EEA." };

  const passwordHash = await hashPassword(v.password);
  const school = await db.transaction(async (tx) => {
    const [s] = await tx
      .insert(schema.schools)
      .values({ name: v.schoolName, principalName: v.principalName, officialEmail: v.officialEmail, phone: v.schoolPhone, address: v.address, city: v.city })
      .returning();
    await tx.insert(schema.campuses).values({ schoolId: s.id, name: "Main campus", address: v.address, city: v.city });
    const [u] = await tx
      .insert(schema.users)
      .values({ email: v.coordinatorEmail, name: v.coordinatorName, phone: v.coordinatorPhone, kind: "school", status: "pending", passwordHash })
      .returning();
    await tx.insert(schema.userRoles).values({ userId: u.id, roleId: role.id, schoolId: s.id });
    return s;
  });
  await audit({ action: "school.registered", entityType: "school", entityId: school.id, after: { name: v.schoolName, city: v.city, coordinator: v.coordinatorEmail } });
  return { ok: true };
}

export async function registerSchoolAction(prev: SchoolSignupState, formData: FormData): Promise<SchoolSignupState> {
  return localizeState(await run(prev, formData), formData);
}
