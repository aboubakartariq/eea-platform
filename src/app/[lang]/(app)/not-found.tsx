import Image from "next/image";
import { LinkButton } from "@/components/ui/button";
import { getTr } from "@/i18n/app-server";

export default async function NotFound() {
  const { tr } = await getTr();
  return (
    <section className="py-24">
      <div className="container-page flex flex-col items-center text-center">
        <Image src="/brand/eea-students.svg" alt="" width={160} height={160} />
        <h1 className="mt-8 text-4xl font-bold">{tr("Page not found")}</h1>
        <p className="mt-3 max-w-md text-muted">{tr("The page you are looking for has moved or does not exist.")}</p>
        <div className="mt-8 flex gap-3">
          <LinkButton href="/">{tr("Go home")}</LinkButton>
        </div>
      </div>
    </section>
  );
}
