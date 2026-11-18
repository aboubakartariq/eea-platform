import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-muted">For EEA staff, school coordinators, students and parents.</p>
      <LoginForm />
    </>
  );
}
