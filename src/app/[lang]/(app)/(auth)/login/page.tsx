import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { getTr } from "@/i18n/app-server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTr();
  return { title: tr("Sign in") };
}

export default async function LoginPage() {
  const { tr } = await getTr();
  return (
    <>
      <h1 className="text-2xl font-bold">{tr("Sign in")}</h1>
      <p className="mt-2 text-sm text-muted">{tr("Parents, schools and staff sign in with their email. Students use their student ID.")}</p>
      <LoginForm />
    </>
  );
}
