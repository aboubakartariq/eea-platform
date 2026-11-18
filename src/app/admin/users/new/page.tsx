import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePermission } from "@/lib/auth/dal";
import { Card, PageHeader } from "@/components/admin/ui";
import { NewUserForm } from "./new-user-form";

export const metadata: Metadata = { title: "Add staff member" };

export default async function NewUserPage() {
  await requirePermission("users.manage");
  const roles = await db.select({ id: schema.roles.id, name: schema.roles.name, description: schema.roles.description, key: schema.roles.key }).from(schema.roles).where(eq(schema.roles.scope, "global")).orderBy(schema.roles.name);
  return (
    <>
      <PageHeader title="Add staff member" description="They get a temporary password and must set up two-step verification at first sign-in." />
      <Card className="max-w-3xl p-6 sm:p-8"><NewUserForm roles={roles} /></Card>
    </>
  );
}
