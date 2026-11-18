import type { Metadata } from "next";
import { CodeForm } from "./code-form";

export const metadata: Metadata = { title: "Two-step verification" };

export default function VerifyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Two-step verification</h1>
      <p className="mt-2 text-sm text-muted">Open your authenticator app and enter the 6-digit code for EEA.</p>
      <CodeForm />
    </>
  );
}
