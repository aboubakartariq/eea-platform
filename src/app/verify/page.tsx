import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { Notice, PageHero } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check that an EEA certificate is genuine using its QR code or certificate number.",
};

export default function VerifyPage() {
  return (
    <>
      <PageHero
        eyebrow="Certificate verification"
        title="Check that a certificate is genuine"
        intro="Every EEA certificate has a unique certificate number and a QR code. Scanning the code opens its verification page."
      />
      <section className="py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="grid size-40 place-items-center rounded-[var(--radius-card)] bg-navy-50 text-navy-600">
            <QrCode className="size-20" aria-hidden strokeWidth={1.4} />
          </div>
          <Notice title="Verification opens with the first certificates">
            Certificate lookup by number goes live when the first EEA certificates are issued. Until then, no certificates exist to check.
          </Notice>
        </div>
      </section>
    </>
  );
}
