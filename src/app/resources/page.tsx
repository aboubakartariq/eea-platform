import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { competitions } from "@/content/competitions";
import { CompetitionIcon } from "@/components/competition-card";
import { Notice, PageHero } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Learning resources",
  description: "Syllabi, sample papers and practice tests for every EEA competition.",
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Learning resources"
        title="Syllabus, sample papers and practice"
        intro="Start with the syllabus for your grade, then practise with sample papers and free practice tests."
      />
      <section className="py-16">
        <div className="container-page space-y-10">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th scope="col" className="p-4 font-semibold">Competition</th>
                  <th scope="col" className="hidden p-4 font-semibold sm:table-cell">Grades</th>
                  <th scope="col" className="p-4 font-semibold">Syllabus</th>
                  <th scope="col" className="hidden p-4 font-semibold md:table-cell">Sample papers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {competitions.map((c) => (
                  <tr key={c.slug}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <CompetitionIcon c={c} className="size-10 rounded-xl" />
                        <span className="font-semibold text-navy-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="hidden p-4 text-muted sm:table-cell">{c.grades.label}</td>
                    <td className="p-4">
                      <Link href={`/competitions/${c.slug}#syllabus`} className="inline-flex items-center gap-1 font-semibold text-navy-600 hover:underline">
                        View <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </td>
                    <td className="hidden p-4 text-muted md:table-cell">Coming before registration closes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Notice title="Free practice tests">
            Practice tests run on the same exam screen as the real competition, so students can get used to the timer, the question palette and saving answers. They open in the student dashboard after registration.
          </Notice>
        </div>
      </section>
    </>
  );
}
