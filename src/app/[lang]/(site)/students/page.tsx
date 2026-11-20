import { BookOpenCheck, ChartNoAxesColumn, FolderHeart, IdCard, Medal, Timer } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHero, SectionHeading } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("students", "/students");

const icons = [BookOpenCheck, IdCard, Timer, ChartNoAxesColumn, Medal, FolderHeart];

export default async function StudentsPage() {
  const { t, href } = await getI18n();
  const p = t.students;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro}>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={href("/competitions")} variant="gold" size="lg">{p.find}</LinkButton>
          <LinkButton href={href("/resources")} variant="outline" size="lg">{p.resources}</LinkButton>
        </div>
      </PageHero>
      <section className="py-20">
        <div className="container-page">
          <SectionHeading eyebrow={p.journeyEyebrow} title={p.journeyTitle} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {p.items.map((b, i) => {
              const Icon = icons[i] ?? Medal;
              return (
                <div key={b.title} className="rounded-[var(--radius-card)] border border-line p-7">
                  <Icon className="size-8 text-magenta" aria-hidden strokeWidth={1.6} />
                  <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="pb-24">
        <div className="container-page">
          <div className="rounded-[2rem] bg-navy-50 p-8 sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">{p.soloTitle}</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">{p.soloText}</p>
            <LinkButton href={href("/register/parent")} className="mt-6" size="lg">{p.soloButton}</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
