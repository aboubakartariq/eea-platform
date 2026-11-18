import type { Metadata } from "next";
import Link from "next/link";
import { news } from "@/content/general";
import { Notice, PageHero } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "News & events",
  description: "Announcements, competition news and event highlights from EEA.",
};

export default function NewsPage() {
  return (
    <>
      <PageHero eyebrow="News & events" title="News and announcements" intro="Competition announcements, results news and highlights from our events." />
      <section className="py-16">
        <div className="container-page">
          {news.length === 0 ? (
            <Notice title="No news yet">
              Announcements and event highlights will be posted here. Follow this page for competition dates and results news.
            </Notice>
          ) : (
            <ul className="grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <li key={n.slug}>
                  <Link href={`/news/${n.slug}`} className="block h-full rounded-[var(--radius-card)] border border-line p-6 hover:border-navy-200">
                    <p className="text-xs text-muted">{formatDate(n.date)}</p>
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
