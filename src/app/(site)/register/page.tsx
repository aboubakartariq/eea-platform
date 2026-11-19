import type { Metadata } from "next";
import { School, UserRound, CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHero } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Register",
  description: "Register your school or register as an individual student for EEA competitions.",
};

const paths = [
  {
    id: "school",
    icon: School,
    title: "Register a school",
    who: "For principals and competition coordinators",
    points: [
      "Create a school account with principal and coordinator details",
      "Get a unique school ID after approval",
      "Upload students from Excel and choose competitions per grade",
      "Pay once for all students and download admit cards",
    ],
  },
  {
    id: "individual",
    icon: UserRound,
    title: "For parents",
    who: "Follow your child, or register them if their school isn't taking part",
    points: [
      "Create a parent account and give consent for your child",
      "Already registered by the school? Link your child with their student ID",
      "Or add your child yourself and choose online competitions for their grade",
      "Create your child's login for exam day",
    ],
  },
];

export default function RegisterPage() {
  return (
    <>
      <PageHero eyebrow="Register" title="Choose how you want to take part" intro="Schools register their students together. Students whose school is not taking part can register on their own." />
      <section className="py-16">
        <div className="container-page space-y-10">
          <div className="grid gap-6 lg:grid-cols-2">
            {paths.map((p) => (
              <article key={p.id} id={p.id} className="scroll-mt-28 rounded-[1.75rem] border border-line p-8 sm:p-10">
                <span className="grid size-14 place-items-center rounded-2xl bg-navy-50 text-navy-600">
                  <p.icon className="size-7" aria-hidden />
                </span>
                <h2 className="mt-6 text-2xl font-bold">{p.title}</h2>
                <p className="mt-1 text-muted">{p.who}</p>
                <ul className="mt-6 space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden />{pt}</li>
                  ))}
                </ul>
                {p.id === "school" ? (
                  <LinkButton href="/register/school" variant="gold" size="lg" className="mt-8">Register your school</LinkButton>
                ) : (
                  <LinkButton href="/register/parent" size="lg" className="mt-8">Create a parent account</LinkButton>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
