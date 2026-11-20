import Image from "next/image";
import { LinkButton } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t, href } = await getI18n();
  return (
    <section className="py-24">
      <div className="container-page flex flex-col items-center text-center">
        <Image src="/brand/eea-students.svg" alt="" width={160} height={160} />
        <h1 className="mt-8 text-4xl font-bold">{t.notFound.title}</h1>
        <p className="mt-3 max-w-md text-muted">{t.notFound.text}</p>
        <div className="mt-8 flex gap-3">
          <LinkButton href={href("/")}>{t.notFound.home}</LinkButton>
          <LinkButton href={href("/competitions")} variant="outline">{t.notFound.competitions}</LinkButton>
        </div>
      </div>
    </section>
  );
}
