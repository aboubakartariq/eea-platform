import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Notice, PageHero } from "@/components/ui/misc";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact the EEA team about competitions, school registration or results.",
};

export default function ContactPage() {
  const { email, phone, whatsapp, address } = site.contact;
  const channels = [
    email && { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    phone && { icon: Phone, label: "Phone", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    whatsapp && { icon: MessageCircle, label: "WhatsApp", value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
    address && { icon: MapPin, label: "Office", value: address, href: undefined },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero eyebrow="Contact" title="We are here to help" intro="Questions about a competition, registering your school or a result? Get in touch with our team." />
      <section className="py-16">
        <div className="container-page">
          {channels.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {channels.map((c) => (
                <li key={c.label} className="rounded-[var(--radius-card)] border border-line p-6">
                  <c.icon className="size-7 text-gold" aria-hidden />
                  <p className="mt-4 text-sm text-muted">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="mt-1 block font-semibold break-words text-navy-900 hover:text-navy-600">{c.value}</a>
                  ) : (
                    <p className="mt-1 font-semibold text-navy-900">{c.value}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Notice title="Contact details coming soon">
              Our phone, WhatsApp, email and office address will be published here. An online enquiry form, with replies tracked by our team, arrives with the next phase of the website.
            </Notice>
          )}
        </div>
      </section>
    </>
  );
}
