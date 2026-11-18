import "server-only";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const ISSUER = "EEA";
const STEP = 30;

export const newTotpSecret = () => generateSecret();

export async function totpQrDataUrl(secret: string, email: string) {
  const uri = generateURI({ issuer: ISSUER, label: email, secret });
  return QRCode.toDataURL(uri, { margin: 1, width: 220, color: { dark: "#14164a", light: "#ffffff" } });
}

/**
 * Checks a 6-digit code, allowing one step of clock drift either way.
 * Returns the time step used (to block replays), or null when invalid.
 */
export async function checkTotp(secret: string, code: string, lastStep: number | null) {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return null;
  const result = await verify({ secret, token, epochTolerance: STEP });
  if (!result.valid) return null;
  const step = Math.floor(Date.now() / 1000 / STEP) + ("delta" in result && typeof result.delta === "number" ? result.delta : 0);
  if (lastStep !== null && step <= lastStep) return null;
  return step;
}
