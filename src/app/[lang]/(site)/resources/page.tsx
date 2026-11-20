import Link from "next/link";
import { getPublishedCompetitions } from "@/lib/competitions";
import { CompetitionIcon } from "@/components/competition-card";
import { Notice, PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";
import { competitionText, gradesText } from "@/i18n/format";

export const generateMetadata = () => pageMetadata("resources", "/resources");

export default async function ResourcesPage() {
  const { t, href } = await getI18n();
  const p = t.resources;
  const competitions = await getPublishedCompetitions();
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="py-16">
        <div className="container-page space-y-10">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
            <table className="w-full text-start text-sm">
              <thead className="bg-surface text-xs text-muted">
                <tr>
                  <th scope="col" className="p-4 text-start font-semibold">{p.competition}</th>
                  <th scope="col" className="hidden p-4 text-start font-semibold sm:table-cell">{p.grades}</th>
                  <th scope="col" className="p-4 text-start font-semibold">{p.syllabus}</th>
                  <th scope="col" className="hidden p-4 text-start font-semibold md:table-cell">{p.samples}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {competitions.map((c) => (
                  <tr key={c.slug}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <CompetitionIcon c={c} className="size-10 rounded-xl" />
                        <span className="font-semibold text-navy-900">{competitionText(t, c).name}</span>
                      </div>
                    </td>
                    <td className="hidden p-4 text-muted sm:table-cell">{gradesText(t, c)}</td>
                    <td className="p-4"><Link href={href(`/competitions/${c.slug}#syllabus`)} className="font-semibold text-navy-600 hover:underline">{p.view}</Link></td>
                    <td className="hidden p-4 text-muted md:table-cell">{p.samplesSoon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Notice title={p.noteTitle}>{p.note}</Notice>
        </div>
      </section>
    </>
  );
}
