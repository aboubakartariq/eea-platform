import "server-only";
import { headers } from "next/headers";

/** Client IP and user agent, for audit logs and rate limits. */
export async function requestInfo() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || h.get("x-real-ip") || null;
  const valid = ip && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null;
  return { ip: valid, userAgent: h.get("user-agent")?.slice(0, 400) ?? null };
}
