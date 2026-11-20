import { QrCode } from "lucide-react";
import { PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";
import { VerifyForm } from "./verify-form";

export const generateMetadata = () => pageMetadata("verify", "/verify");

export default async function VerifyPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHero eyebrow={t.verify.eyebrow} title={t.verify.title} intro={t.verify.intro} />
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
