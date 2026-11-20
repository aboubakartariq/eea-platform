import Link from "next/link";
import { PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";
import { SchoolSignupForm } from "./signup-form";

export const generateMetadata = () => pageMetadata("schoolSignup", "/register/school");

export default async function SchoolSignupPage() {
  const { t } = await getI18n();
  const p = t.schoolSignup;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="py-14">
        <div className="container-page grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[1.75rem] border border-line p-6 sm:p-10"><SchoolSignupForm /></div>
          <aside className="space-y-4 text-sm">
            <div className="rounded-[var(--radius-card)] bg-surface p-6">
              <h2 className="text-base font-semibold">{p.nextTitle}</h2>
              <ol className="mt-3 list-decimal space-y-2 ps-5 text-muted">{p.next.map((n) => <li key={n}>{n}</li>)}</ol>
            </div>
            <p className="px-2 text-muted">{p.already} <Link href="/login" className="font-semibold text-navy-600 underline underline-offset-4">{t.common.signIn}</Link></p>
            <p className="px-2 text-xs text-muted">{t.common.portalsEnglish}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
