import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/misc";
import { ContactForm } from "./contact-form";
import { site } from "@/lib/site";
import { getI18n, pageMetadata } from "@/i18n/server";

export const generateMetadata = () => pageMetadata("contact", "/contact");

export default async function ContactPage() {
  const { t } = await getI18n();
  const p = t.contact;
  const { email, phone, whatsapp, address } = site.contact;
  const channels = [
    email && { icon: Mail, label: p.email, value: email, href: `mailto:${email}` },
    phone && { icon: Phone, label: p.phone, value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    whatsapp && { icon: MessageCircle, label: p.whatsapp, value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
    address && { icon: MapPin, label: p.office, value: address, href: undefined },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="py-16">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative rounded-[1.75rem] border border-line p-6 sm:p-10">
              <h2 className="text-2xl font-bold">{p.formTitle}</h2>
              <p className="mt-2 mb-8 text-muted">{p.formIntro}</p>
              <ContactForm />
            </div>
            <div className="space-y-4">
              {channels.length > 0 ? (
                channels.map((c) => (
                  <div key={c.label} className="rounded-[var(--radius-card)] border border-line p-6">
                    <c.icon className="size-7 text-gold" aria-hidden />
                    <p className="mt-4 text-sm text-muted">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} dir="ltr" className="mt-1 block font-semibold break-words text-navy-900 hover:text-navy-600">{c.value}</a>
                    ) : (
                      <p className="mt-1 font-semibold text-navy-900">{c.value}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-[var(--radius-card)] bg-surface p-6 text-sm text-muted">
                  {p.noChannels}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
