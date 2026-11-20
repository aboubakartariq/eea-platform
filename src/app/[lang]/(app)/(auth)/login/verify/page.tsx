import type { Metadata } from "next";
import { CodeForm } from "./code-form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Two-step verification") };
}

export default async function VerifyPage() {
  const { tr } = await getTr();
  return (
    <>
      <h1 className="text-2xl font-bold">{tr("Two-step verification")}</h1>
      <p className="mt-2 text-sm text-muted">{tr("Open your authenticator app and enter the 6-digit code for EEA.")}</p>
      <CodeForm />
    </>
  );
}
