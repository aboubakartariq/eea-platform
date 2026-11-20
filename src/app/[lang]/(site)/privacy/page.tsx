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
      sections={[
        { h: "What we collect", p: ["For students: name, grade, school, date of birth and a parent or guardian's contact details. For schools: school details and coordinator contacts. Payment details are handled by our payment providers and are not stored by EEA."] },
        { h: "Why we collect it", p: ["Only to register students, run competitions, publish results, issue certificates and awards, and contact schools and parents about these."] },
        { h: "Who can see it", p: ["A student's records are visible to the student, their linked parents or guardians, their school's coordinators and authorised EEA staff. Public result lists show names only where the competition settings and consent allow."] },
        { h: "Consent", p: ["A parent or guardian gives consent when registering a student individually. Schools confirm they have parental consent when registering students."] },
        { h: "Security and retention", p: ["Data is encrypted in transit, access is limited by role and every sensitive action is logged. Records are kept only as long as needed, and parents can ask for a student's data to be corrected or deleted."] },
      ]}
    />
  );
}
