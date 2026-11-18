import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { footerNav, site } from "@/lib/site";

export function Footer() {
  const { email, phone, whatsapp, address } = site.contact;
  const hasContact = Boolean(email || phone || whatsapp || address);

  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-4">
            <Image src="/brand/eea-seal-white.svg" alt="" width={64} height={64} />
            <p className="font-display text-lg leading-snug font-semibold text-white">
              Educational Extracurricular
              <br />
              Activities
            </p>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-200">{site.description}</p>
          {hasContact && (
            <ul className="mt-6 space-y-2 text-sm">
              {email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-gold" aria-hidden />
                  <a href={`mailto:${email}`} className="hover:text-white">{email}</a>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-gold" aria-hidden />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white">{phone}</a>
                </li>
              )}
              {whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-gold" aria-hidden />
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} className="hover:text-white">WhatsApp</a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 text-gold" aria-hidden />
                  <span>{address}</span>
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="font-display text-sm font-semibold tracking-wide text-white">{group.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-navy-200 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-navy-200 sm:flex-row sm:items-center sm:justify-between">
          <p>© {site.copyrightYear} {site.legalName} All rights reserved.</p>
          <Link href="/verify" className="hover:text-white">Verify a certificate</Link>
        </div>
      </div>
    </footer>
  );
}
