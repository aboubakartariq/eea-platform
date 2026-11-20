import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession, homeFor } from "@/lib/auth/dal";
import { decrypt, encrypt } from "@/lib/server/crypto";
import { newTotpSecret, totpQrDataUrl } from "@/lib/auth/totp";
import { SetupForm } from "./setup-form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Set up two-step verification") };
}

async function Setup() {
  const { tr } = await getTr();
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.user.mustChangePassword) redirect("/account/password");
  if (s.user.totpEnabled) redirect(homeFor(s.user));

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, s.user.id) });
  let secret = user?.totpSecretEnc ? decrypt(user.totpSecretEnc) : null;
  if (!secret) {
    secret = newTotpSecret();
    await db.update(schema.users).set({ totpSecretEnc: encrypt(secret) }).where(eq(schema.users.id, s.user.id));
  }
  const qr = await totpQrDataUrl(secret, s.user.email);

  return (
    <>
      <ol className="mt-6 space-y-3 text-sm text-muted">
        <li><span className="font-semibold text-navy-900">1.</span>{" "}{tr("Install an authenticator app, such as Google Authenticator or Microsoft Authenticator.")}</li>
        <li><span className="font-semibold text-navy-900">2.</span>{" "}{tr("Scan this code with the app.")}</li>
      </ol>
      <div className="mt-5 flex justify-center rounded-2xl bg-surface p-4">
        <Image src={qr} alt={tr("QR code for your authenticator app")} width={200} height={200} unoptimized />
      </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer">{tr("Can't scan? Enter this key instead")}</summary>
        <code className="mt-2 block rounded-lg bg-surface p-3 font-mono text-sm break-all text-navy-900">{secret.match(/.{1,4}/g)?.join(" ")}</code>
      </details>
      <p className="mt-5 text-sm text-muted"><span className="font-semibold text-navy-900">3.</span>{" "}{tr("Enter the 6-digit code the app shows.")}</p>
      <SetupForm />
    </>
  );
}

export default async function TwoFactorSetupPage() {
  const { tr } = await getTr();
  return (
    <>
      <h1 className="text-2xl font-bold">{tr("Set up two-step verification")}</h1>
      <p className="mt-2 text-sm text-muted">{tr("Staff accounts need a code from your phone as well as a password. This protects students' data if a password is ever stolen.")}</p>
      <Suspense fallback={<div className="mt-6 h-72 animate-pulse rounded-2xl bg-surface" />}>
        <Setup />
      </Suspense>
    </>
  );
}
