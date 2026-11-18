import "server-only";
import { db, schema } from "@/db";
import { requestInfo } from "./request";

type AuditInput = {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
};

/** Records a sensitive action. Never pass passwords, tokens or secrets in before/after. */
export async function audit(entry: AuditInput) {
  const { ip, userAgent } = await requestInfo();
  await db.insert(schema.auditLogs).values({
    actorUserId: entry.actorUserId ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ip,
    userAgent,
  });
}
