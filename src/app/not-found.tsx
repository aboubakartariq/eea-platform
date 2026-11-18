import Image from "next/image";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="py-24">
      <div className="container-page flex flex-col items-center text-center">
        <Image src="/brand/eea-students.svg" alt="" width={160} height={160} />
        <h1 className="mt-8 text-4xl font-bold">Page not found</h1>
        <p className="mt-3 max-w-md text-muted">The page you are looking for has moved or does not exist.</p>
        <div className="mt-8 flex gap-3">
          <LinkButton href="/">Go home</LinkButton>
          <LinkButton href="/competitions" variant="outline">Competitions</LinkButton>
        </div>
      </div>
    </section>
  );
}
