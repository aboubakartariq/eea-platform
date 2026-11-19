import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended Argon2id settings (19 MiB memory, 2 iterations).
const OPTIONS = { algorithm: 2 /* Argon2id */, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (password: string) => hash(password, OPTIONS);

export async function verifyPassword(stored: string | null | undefined, password: string) {
  if (!stored) return false;
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

const COMMON = new Set(["password", "password1", "password123", "1234567890", "12345678910", "qwertyuiop", "pakistan123", "admin12345", "iloveyou12", "welcome123"]);

/** Returns a reason the password is not acceptable, or null if it is fine. */
export function passwordProblem(password: string, context: { email?: string; name?: string; minLength?: number } = {}): string | null {
  const min = context.minLength ?? 10;
  if (password.length < min) return `Use at least ${min} characters.`;
  if (password.length > 128) return "Use at most 128 characters.";
  if (COMMON.has(password.toLowerCase())) return "This password is too common.";
  const lower = password.toLowerCase();
  const local = context.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return "Don't include your email address.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9\W_]/.test(password)) return "Mix letters with numbers or symbols.";
  return null;
}

/** A readable temporary password, e.g. for a new staff account. */
export function temporaryPassword() {
  const words = "amber cedar delta ember falcon garnet harbor indigo jasmine kestrel lumen meadow nectar orchid pepper quartz raven saffron tundra velvet willow".split(" ");
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;
  return `${pick()}-${pick()}-${n}`;
}
