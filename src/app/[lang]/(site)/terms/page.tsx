import { LegalPage } from "@/components/legal-page";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.meta.terms.title };
}

export default async function Page() {
  const { t } = await getI18n();
  return (
    <LegalPage
      title={t.meta.terms.title}
      intro={t.legal.termsIntro}
      sections={[
        { h: "Eligibility", p: ["Students take part in the grade they are currently studying. Each competition page lists the grades and modes available."] },
        { h: "Conduct", p: ["Students must do their own work. Unfair means, sharing papers or impersonation lead to disqualification."] },
        { h: "Results", p: ["Results are final once published, except where a correction request is upheld. Correction requests can be made within the period stated with the results."] },
        { h: "Certificates and awards", p: ["Certificates are issued digitally with a unique number. Physical awards are sent to the student's school unless agreed otherwise."] },
      ]}
    />
  );
}
