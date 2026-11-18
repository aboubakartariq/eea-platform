import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund policy" };

export default function Page() {
  return (
    <LegalPage
      title="Refund policy"
      intro="When registration fees can be refunded, and how."
      sections={[
        { h: "Before registration closes", p: ["Refund terms before the registration deadline will be set by EEA and published here."] },
        { h: "After registration closes", p: ["Refund terms after the deadline, and for competitions cancelled by EEA, will be published here."] },
        { h: "How refunds are paid", p: ["Approved refunds are returned to the original payment method, and every refund is recorded with a receipt."] },
      ]}
    />
  );
}
