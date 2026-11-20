import Link from "next/link";
import { news } from "@/content/general";
import { Notice, PageHero } from "@/components/ui/misc";
import { getI18n, pageMetadata } from "@/i18n/server";
import { dateLong } from "@/i18n/format";

export const generateMetadata = () => pageMetadata("news", "/news");

export default async function NewsPage() {
  const { t, href, intl } = await getI18n();
  const p = t.news;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <section className="py-16">
        <div className="container-page">
          {news.length === 0 ? (
            <Notice title={p.emptyTitle}>{p.empty}</Notice>
          ) : (
            <ul className="grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <li key={n.slug}>
                  <Link href={href(`/news/${n.slug}`)} className="block h-full rounded-[var(--radius-card)] border border-line p-6 hover:border-navy-200">
                    <p className="text-xs text-muted">{dateLong(intl, n.date)}</p>
                    <h2 className="mt-2 text-lg font-semibold">{n.title}</h2>
                    <p className="mt-2 text-muted">{n.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
