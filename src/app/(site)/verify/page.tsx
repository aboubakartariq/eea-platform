import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { PageHero } from "@/components/ui/misc";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check that an EEA certificate is genuine using its QR code or verification code.",
};

export default function VerifyPage() {
  return (
    <>
      <PageHero
        eyebrow="Certificate verification"
        title="Check that a certificate is genuine"
        intro="Every EEA certificate has a QR code and a verification code. Scan the code, or type the verification code below."
      />
      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="grid size-40 place-items-center rounded-[var(--radius-card)] bg-navy-50 text-navy-600">
            <QrCode className="size-20" aria-hidden strokeWidth={1.4} />
          </div>
          <VerifyForm />
        </div>
      </section>
    </>
  );
}
