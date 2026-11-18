/**
 * Idempotent seed: permission catalogue and default roles.
 * - New permissions are added; removed ones are deleted.
 * - A role's permissions are set only when the role is first created, so later
 *   edits made in /admin/roles are kept. Super Administrator always gets everything.
 * Run: npm run db:seed
 */
import { eq, notInArray } from "drizzle-orm";
import { db, pool, schema } from "./db";
import { DEFAULT_ROLES, PERMISSIONS } from "../src/lib/auth/permissions";
import { COMPETITIONS } from "./competitions-seed";

async function main() {
  const entries = Object.entries(PERMISSIONS).map(([key, v]) => ({ key, module: v.module, description: v.description }));
  for (const p of entries) {
    await db.insert(schema.permissions).values(p).onConflictDoUpdate({ target: schema.permissions.key, set: { module: p.module, description: p.description } });
  }
  await db.delete(schema.permissions).where(notInArray(schema.permissions.key, entries.map((e) => e.key)));

  for (const r of DEFAULT_ROLES) {
    const existing = await db.query.roles.findFirst({ where: eq(schema.roles.key, r.key) });
    let roleId = existing?.id;
    if (!existing) {
      const [row] = await db.insert(schema.roles).values({ key: r.key, name: r.name, description: r.description, isSystem: true, scope: r.scope }).returning();
      roleId = row.id;
      if (r.permissions.length) await db.insert(schema.rolePermissions).values(r.permissions.map((p) => ({ roleId: row.id, permissionKey: p })));
      console.log(`+ role ${r.name} (${r.permissions.length} permissions)`);
    }
    if (r.key === "super_admin" && roleId) {
      await db.insert(schema.rolePermissions).values(r.permissions.map((p) => ({ roleId: roleId!, permissionKey: p }))).onConflictDoNothing();
    }
  }
  for (const c of COMPETITIONS) {
    const inserted = await db.insert(schema.competitions).values({ ...c, status: "published" }).onConflictDoNothing({ target: schema.competitions.slug }).returning({ id: schema.competitions.id });
    if (inserted.length) console.log(`+ competition ${c.name}`);
  }

  console.log(`Seed complete: ${entries.length} permissions, ${DEFAULT_ROLES.length} roles.`);
}

main().then(() => pool.end()).catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
