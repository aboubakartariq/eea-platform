import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/misc";
import { SchoolSignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Register your school", description: "Create a school account to register students for EEA competitions." };

export default function SchoolSignupPage() {
  return (
    <>
      <PageHero eyebrow="School registration" title="Register your school" intro="Create your school account. Our team checks every registration; once approved, you get a school ID and can add students and register them for competitions." />
      <section className="py-14">
        <div className="container-page grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[1.75rem] border border-line p-6 sm:p-10"><SchoolSignupForm /></div>
          <aside className="space-y-4 text-sm">
            <div className="rounded-[var(--radius-card)] bg-surface p-6">
              <h2 className="text-base font-semibold">What happens next</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
                <li>We verify your school, usually by phone.</li>
                <li>You receive your school ID and can sign in.</li>
                <li>Add students one by one or upload an Excel sheet.</li>
                <li>Choose competitions and register your students.</li>
              </ol>
            </div>
            <p className="px-2 text-muted">Already registered? <Link href="/login" className="font-semibold text-navy-600 underline underline-offset-4">Sign in</Link></p>
          </aside>
        </div>
      </section>
    </>
  );
}
