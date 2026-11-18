/**
 * Creates the first Super Administrator with a one-time temporary password.
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" npm run admin:create
 * The password is printed once; the user must change it and set up two-factor login on first sign-in.
 */
import { sql } from "drizzle-orm";
import { db, pool, schema } from "./db";
import { hashPassword, temporaryPassword } from "../src/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  if (!email || !name) throw new Error("Set ADMIN_EMAIL and ADMIN_NAME.");
  const role = await db.query.roles.findFirst({ where: (r, { eq }) => eq(r.key, "super_admin") });
  if (!role) throw new Error("Run `npm run db:seed` first.");
  const existing = await db.query.users.findFirst({ where: sql`lower(${schema.users.email}) = ${email}` });
  if (existing) throw new Error(`A user with ${email} already exists.`);

  const password = process.env.ADMIN_PASSWORD || temporaryPassword();
  const [user] = await db
    .insert(schema.users)
    .values({ email, name, kind: "staff", passwordHash: await hashPassword(password), mustChangePassword: !process.env.ADMIN_PASSWORD })
    .returning();
  await db.insert(schema.userRoles).values({ userId: user.id, roleId: role.id });
  await db.insert(schema.auditLogs).values({ action: "user.created", entityType: "user", entityId: user.id, after: { email, role: "super_admin", via: "cli" } });
  console.log(`Super Administrator created: ${email}`);
  if (!process.env.ADMIN_PASSWORD) console.log(`Temporary password (shown once): ${password}`);
}

main().then(() => pool.end()).catch(async (e) => { console.error(e.message); await pool.end(); process.exit(1); });
