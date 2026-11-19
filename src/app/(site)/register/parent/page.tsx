import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/misc";
import { ParentSignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create a parent account", description: "Register your child for EEA competitions and follow their results." };

export default function ParentSignupPage() {
  return (
    <>
      <PageHero eyebrow="Parents" title="Create a parent account" intro="Follow your child's competitions, results and certificates. If their school isn't taking part, you can register them yourself." />
      <section className="py-14">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[1.75rem] border border-line p-6 sm:p-10"><ParentSignupForm /></div>
          <aside className="space-y-4 text-sm">
            <div className="rounded-[var(--radius-card)] bg-surface p-6">
              <h2 className="text-base font-semibold">After you sign up</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>If your child&apos;s school registered them, link them using their student ID, date of birth and your mobile number.</li>
                <li>Otherwise, add your child yourself and register them for online competitions.</li>
                <li>Create a login for your child to use on exam day.</li>
              </ul>
            </div>
            <p className="px-2 text-muted">Already have an account? <Link href="/login" className="font-semibold text-navy-600 underline underline-offset-4">Sign in</Link></p>
          </aside>
        </div>
      </section>
    </>
  );
}
