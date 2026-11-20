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
      sections={t.legal.terms}
    />
  );
}
