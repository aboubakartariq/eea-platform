import type { Metadata } from "next";
import { BadgeCheck, ClipboardList, FileSpreadsheet, Headphones, LineChart, Building2, Receipt, School } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Faq, PageHero, SectionHeading } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "For schools",
  description: "Register your school, enrol whole classes from Excel and manage every competition from one dashboard.",
};

const benefits = [
  { icon: FileSpreadsheet, title: "Bulk registration", text: "Upload a class list from Excel. Mistakes and duplicates are flagged before you submit." },
  { icon: Building2, title: "Multiple campuses", text: "Manage every campus under one school account, with its own coordinator." },
  { icon: Receipt, title: "One invoice", text: "Pay for all students together online or by bank transfer, with receipts kept for you." },
  { icon: ClipboardList, title: "Exam paperwork done", text: "Admit cards, roll numbers, instructions and paper-exam material in one place." },
  { icon: LineChart, title: "Result reports", text: "Grade-wise and subject-wise reports that show where your students shine." },
  { icon: BadgeCheck, title: "Recognition", text: "Certificates for students, teachers and the principal, plus school awards." },
];

const process = [
  { title: "Create your school account", text: "Fill in your school, principal and coordinator details. Our team verifies and approves the account." },
  { title: "Get your school ID", text: "Every approved school gets a unique ID and a secure dashboard for its coordinators." },
  { title: "Add students and choose competitions", text: "Upload students from Excel or add them one by one, then pick competitions per grade." },
  { title: "Pay and receive admit cards", text: "Pay online or by bank transfer. Admit cards and roll numbers are issued once payment is confirmed." },
  { title: "Conduct the exam", text: "Students take the exam online, or on paper at your school using the material we provide." },
  { title: "Results and awards", text: "See results in your dashboard, download certificates and receive awards for your achievers." },
];

const faqs = [
  { q: "Is there a minimum number of students?", a: "No. A school can register any number of students. Paper exams at school may need a minimum per competition, which is shown when you register." },
  { q: "Can we conduct the exam at our school?", a: "Yes. For paper exams we provide question papers and answer sheets, and your coordinator supervises. Online exams can be held in your computer lab." },
  { q: "How do we pay?", a: "Online payment options and bank transfer will both be available. Every payment produces a receipt in your dashboard." },
];

export default function SchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="For schools"
        title="Everything your school needs, in one dashboard"
        intro="From registering whole classes to celebrating your position holders, EEA keeps competitions simple for coordinators and rewarding for students."
      >
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/register#school" variant="gold" size="lg">Register your school</LinkButton>
          <LinkButton href="/contact" variant="outline" size="lg">Talk to our team</LinkButton>
        </div>
      </PageHero>

      <section className="py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Benefits" title="Why schools choose EEA" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-[var(--radius-card)] border border-line p-7">
                <b.icon className="size-8 text-navy-600" aria-hidden strokeWidth={1.6} />
                <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="Process" title="How school registration works" intro="Six steps from sign-up to awards. Our team is available at every stage." />
          <ol className="relative space-y-8 border-l-2 border-navy-100 pl-8">
            {process.map((p, i) => (
              <li key={p.title} className="relative">
                <span className="absolute -left-[3.05rem] grid size-9 place-items-center rounded-full bg-navy-600 font-display text-sm font-bold text-white ring-4 ring-surface">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-1 leading-relaxed text-muted">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Partnership" title="Become a partner school" intro="Partner schools get early dates, a dedicated coordinator contact and recognition on our website." />
            <ul className="mt-8 space-y-3">
              {[
                { icon: School, t: "Host paper exams on your own campus" },
                { icon: Headphones, t: "A named EEA contact for your coordinators" },
                { icon: BadgeCheck, t: "Recognition certificates for your school" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 font-medium"><x.icon className="size-5 text-gold" aria-hidden />{x.t}</li>
              ))}
            </ul>
          </div>
          <Faq items={faqs} />
        </div>
      </section>
    </>
  );
}
