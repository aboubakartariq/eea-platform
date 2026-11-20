import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { BadgeCheck, ShieldAlert, ShieldX } from "lucide-react";
import { verifyLookup } from "@/lib/server/certificates";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestInfo } from "@/lib/server/request";
import { fill } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { competitionText, dateLong, gradeText } from "@/i18n/format";
import { VerifyForm } from "../verify-form";

export const metadata: Metadata = { robots: { index: false, follow: false } };

async function Result({ params }: { params: Promise<{ code: string }> }) {
  const { t, intl } = await getI18n();
  const v = t.verify;
  const { code } = await params;
  const { ip } = await requestInfo();
  if (!(await rateLimit(`verify:${ip ?? "unknown"}`, 30, 300))) {
    return <Box tone="amber" icon={<ShieldAlert className="size-10" />} title={v.tooMany}>{v.tooManyText}</Box>;
  }
  const found = await verifyLookup(code);
  if (!found) return <Box tone="red" icon={<ShieldX className="size-10" />} title={v.notFound}>{v.notFoundText}</Box>;
  const c = found.cert;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (c.revokedAt) {
    return (
      <Box tone="red" icon={<ShieldX className="size-10" />} title={v.revoked}>
        {fill(v.revokedText, { serial: c.serial, name: c.studentName, date: dateLong(intl, iso(c.revokedAt)) })}
      </Box>
    );
  }
  const year = (found.examDate ?? iso(c.issuedAt)).slice(0, 4);
  const rows: [string, string][] = [
    [v.fields.name, c.studentName],
    [v.fields.award, t.awardNames[c.awardLabel] ?? c.awardLabel],
    [v.fields.competition, `${competitionText(t, { slug: found.slug, name: found.competition, summary: "" }).name} ${year}`],
    [v.fields.grade, gradeText(t, c.grade)],
    [v.fields.school, c.schoolName ?? v.fields.individual],
    [v.fields.serial, c.serial],
    [v.fields.issued, dateLong(intl, iso(c.issuedAt))],
  ];
  return (
    <Box tone="green" icon={<BadgeCheck className="size-10" />} title={v.genuine}>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
        {rows.map(([k, val]) => <Fragment key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold text-ink">{val}</dd></Fragment>)}
      </dl>
    </Box>
  );
}

function Box({ tone, icon, title, children }: { tone: "green" | "red" | "amber"; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const t = { green: "bg-emerald-50 ring-emerald-200 text-emerald-700", red: "bg-red-50 ring-red-200 text-red-700", amber: "bg-amber-50 ring-amber-200 text-amber-700" }[tone];
  return (
    <div className={`max-w-2xl rounded-[var(--radius-card)] p-8 ring-1 ${t}`}>
      <div className="flex items-center gap-4">{icon}<h1 className="text-2xl font-bold text-navy-900">{title}</h1></div>
      <div className="mt-3 text-ink">{children}</div>
    </div>
  );
}

async function Footer() {
  const { t, href } = await getI18n();
  return (
    <>
      <div>
        <p className="mb-3 text-sm text-muted">{t.verify.another}</p>
        <VerifyForm />
      </div>
      <p className="text-sm text-muted"><Link href={href("/verify")} className="hover:underline">{t.verify.about}</Link></p>
    </>
  );
}

export default function VerifyCode({ params }: { params: Promise<{ code: string }> }) {
  return (
    <section className="py-16">
      <div className="container-page space-y-10">
        <Suspense fallback={<p className="text-muted">…</p>}>
          <Result params={params} />
        </Suspense>
        <Footer />
      </div>
    </section>
  );
}
