import { LegalPage } from "@/components/legal-page";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.meta.privacy.title };
}

export default async function Page() {
  const { t } = await getI18n();
  return (
    <LegalPage
      title={t.meta.privacy.title}
      intro={t.legal.privacyIntro}
      sections={t.legal.privacy}
    />
  );
}
