import Image from "next/image";
import { HeartHandshake, Lightbulb, Scale, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHero, SectionHeading } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("about", "/about");

const icons = [Scale, Lightbulb, ShieldCheck, HeartHandshake];

export default async function AboutPage() {
  const { t, href } = await getI18n();
  const p = t.about;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={t.meta.description} />
      <section className="py-20">
        <div className="container-page grid items-center gap-14 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <SectionHeading eyebrow={p.missionEyebrow} title={p.missionTitle} />
            <div className="prose-eea mt-6 max-w-2xl">{p.mission.map((m) => <p key={m}>{m}</p>)}</div>
          </div>
          <figure className="rounded-[2rem] bg-surface p-10 text-center">
            <Image src="/brand/eea-seal.svg" alt={p.sealAlt} width={260} height={260} className="mx-auto" />
            <figcaption className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-muted">{p.seal}</figcaption>
          </figure>
        </div>
      </section>
      <section className="border-t border-line bg-surface py-20">
        <div className="container-page">
          <SectionHeading eyebrow={p.valuesEyebrow} title={p.valuesTitle} align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {p.values.map((v, i) => {
              const Icon = icons[i] ?? Scale;
              return (
                <div key={v.title} className="rounded-[var(--radius-card)] bg-white p-7 ring-1 ring-line">
                  <Icon className="size-8 text-navy-600" aria-hidden strokeWidth={1.6} />
                  <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{v.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <LinkButton href={href("/contact")} size="lg">{p.contact}</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
