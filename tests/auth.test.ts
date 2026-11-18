import { describe, expect, it, beforeAll } from "vitest";
import { generate } from "otplib";
import { hashPassword, passwordProblem, temporaryPassword, verifyPassword } from "@/lib/auth/password";
import { ALL_PERMISSIONS, DEFAULT_ROLES, PERMISSIONS } from "@/lib/auth/permissions";

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("passwords", () => {
  it("hashes with Argon2id and verifies", async () => {
    const h = await hashPassword("correct horse 42");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "correct horse 42")).toBe(true);
    expect(await verifyPassword(h, "wrong horse 42")).toBe(false);
    expect(await verifyPassword(null, "x")).toBe(false);
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });

  it("rejects weak passwords", () => {
    expect(passwordProblem("short1")).toMatch(/10 characters/);
    expect(passwordProblem("password123")).toMatch(/common/);
    expect(passwordProblem("onlyletterslong")).toMatch(/numbers or symbols/);
    expect(passwordProblem("asif.khan2026", { email: "asif.khan@example.com" })).toMatch(/email/);
    expect(passwordProblem("Blue-river-81")).toBeNull();
  });

  it("generates temporary passwords that pass the policy", () => {
    for (let i = 0; i < 50; i++) expect(passwordProblem(temporaryPassword())).toBeNull();
  });
});

describe("permission catalogue and default roles", () => {
  it("every role permission exists in the catalogue", () => {
    for (const r of DEFAULT_ROLES) for (const p of r.permissions) expect(PERMISSIONS).toHaveProperty(p);
  });
  it("super admin has every staff permission and no portal permission", () => {
    const sa = DEFAULT_ROLES.find((r) => r.key === "super_admin")!;
    expect(sa.permissions.length).toBe(ALL_PERMISSIONS.filter((p) => !p.startsWith("portal.")).length);
  });
  it("administrator cannot manage roles or settings", () => {
    const admin = DEFAULT_ROLES.find((r) => r.key === "admin")!;
    expect(admin.permissions).not.toContain("roles.manage");
    expect(admin.permissions).not.toContain("settings.manage");
  });
  it("school and family roles only get portal permissions", () => {
    for (const r of DEFAULT_ROLES.filter((r) => r.scope !== "global")) expect(r.permissions.every((p) => p.startsWith("portal."))).toBe(true);
  });
  it("there are 11 default roles, as in the plan", () => expect(DEFAULT_ROLES).toHaveLength(11));
});

describe("encryption and two-factor codes", () => {
  it("encrypts and decrypts, and detects tampering", async () => {
    const { encrypt, decrypt } = await import("@/lib/server/crypto");
    const enc = encrypt("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP");
    expect(enc).not.toContain("JBSWY3");
    expect(decrypt(enc)).toBe("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP");
    const bad = Buffer.from(enc, "base64");
    bad[bad.length - 1] ^= 1;
    expect(() => decrypt(bad.toString("base64"))).toThrow();
  });

  it("accepts a current code once and rejects replays and wrong codes", async () => {
    const { checkTotp, newTotpSecret } = await import("@/lib/auth/totp");
    const secret = newTotpSecret();
    const code = await generate({ secret });
    const step = await checkTotp(secret, code, null);
    expect(step).not.toBeNull();
    expect(await checkTotp(secret, code, step)).toBeNull(); // replay
    expect(await checkTotp(secret, "000000" === code ? "111111" : "000000", null)).toBeNull();
    expect(await checkTotp(secret, "12ab56", null)).toBeNull();
  });
});
