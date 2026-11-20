import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { PasswordForm } from "./password-form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Change password") };
}

async function Intro() {
  const { tr } = await getTr();
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.user.totpEnabled && !s.mfaVerified) redirect("/login/verify");
  return s.user.mustChangePassword ? (
    <p className="mt-2 text-sm text-muted">{tr("Welcome, {name}. Please replace your temporary password before continuing.", { name: s.user.name })}</p>
  ) : (
    <p className="mt-2 text-sm text-muted">{tr("Signed in as {email}.", { email: s.user.email })}</p>
  );
}

export default async function PasswordPage() {
  const { tr } = await getTr();
  return (
    <>
      <h1 className="text-2xl font-bold">{tr("Choose a new password")}</h1>
      <Suspense fallback={<p className="mt-2 h-5 text-sm text-muted">{tr("Loading…")}</p>}>
        <Intro />
      </Suspense>
      <PasswordForm />
    </>
  );
}
