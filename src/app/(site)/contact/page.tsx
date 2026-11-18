import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/misc";
import { ContactForm } from "./contact-form";
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
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative rounded-[1.75rem] border border-line p-6 sm:p-10">
              <h2 className="text-2xl font-bold">Send us a message</h2>
              <p className="mt-2 mb-8 text-muted">We read every message and reply by email.</p>
              <ContactForm />
            </div>
            <div className="space-y-4">
              {channels.length > 0 ? (
                channels.map((c) => (
                  <div key={c.label} className="rounded-[var(--radius-card)] border border-line p-6">
                    <c.icon className="size-7 text-gold" aria-hidden />
                    <p className="mt-4 text-sm text-muted">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="mt-1 block font-semibold break-words text-navy-900 hover:text-navy-600">{c.value}</a>
                    ) : (
                      <p className="mt-1 font-semibold text-navy-900">{c.value}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-[var(--radius-card)] bg-surface p-6 text-sm text-muted">
                  Phone, WhatsApp and office details will be listed here soon. Until then, the form is the quickest way to reach us.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
