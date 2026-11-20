import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Change password" };

async function Intro() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.user.totpEnabled && !s.mfaVerified) redirect("/login/verify");
  return s.user.mustChangePassword ? (
    <p className="mt-2 text-sm text-muted">Welcome, {s.user.name}. Please replace your temporary password before continuing.</p>
  ) : (
    <p className="mt-2 text-sm text-muted">Signed in as {s.user.email}.</p>
  );
}

export default function PasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <Suspense fallback={<p className="mt-2 h-5 text-sm text-muted">Loading…</p>}>
        <Intro />
      </Suspense>
      <PasswordForm />
    </>
  );
}
