import { LegalPage } from "@/components/legal-page";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.meta.refunds.title };
}

export default async function Page() {
  const { t } = await getI18n();
  return (
    <LegalPage
      title={t.meta.refunds.title}
      intro={t.legal.refundsIntro}
      sections={[
        { h: "Before registration closes", p: ["Refund terms before the registration deadline will be set by EEA and published here."] },
        { h: "After registration closes", p: ["Refund terms after the deadline, and for competitions cancelled by EEA, will be published here."] },
        { h: "How refunds are paid", p: ["Approved refunds are returned to the original payment method, and every refund is recorded with a receipt."] },
      ]}
    />
  );
}
