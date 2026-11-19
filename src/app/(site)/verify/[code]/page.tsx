import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { BadgeCheck, ShieldAlert, ShieldX } from "lucide-react";
import { gradeName } from "@/lib/competition-types";
import { verifyLookup } from "@/lib/server/certificates";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestInfo } from "@/lib/server/request";
import { formatDate } from "@/lib/utils";
import { VerifyForm } from "../verify-form";

export const metadata: Metadata = { title: "Certificate check", robots: { index: false, follow: false } };

async function Result({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { ip } = await requestInfo();
  if (!(await rateLimit(`verify:${ip ?? "unknown"}`, 30, 300))) {
    return <Box tone="amber" icon={<ShieldAlert className="size-10" />} title="Too many checks">Please wait a few minutes and try again.</Box>;
  }
  const found = await verifyLookup(code);
  if (!found) {
    return (
      <Box tone="red" icon={<ShieldX className="size-10" />} title="No certificate found">
        No EEA certificate has this verification code. Check the code on the certificate and try again. If it still doesn&apos;t match, the certificate may not be genuine.
      </Box>
    );
  }
  const c = found.cert;
  const rows: [string, string][] = [
    ["Name", c.studentName],
    ["Award", c.awardLabel],
    ["Competition", `${found.competition} ${(found.examDate ?? c.issuedAt.toISOString()).slice(0, 4)}`],
    ["Grade", gradeName(c.grade)],
    ["School", c.schoolName ?? "Individual entry"],
    ["Certificate no.", c.serial],
    ["Issued", formatDate(c.issuedAt.toISOString().slice(0, 10))],
  ];
  return c.revokedAt ? (
    <Box tone="red" icon={<ShieldX className="size-10" />} title="This certificate has been revoked">
      Certificate {c.serial} for {c.studentName} is no longer valid (revoked {formatDate(c.revokedAt.toISOString().slice(0, 10))}).
    </Box>
  ) : (
    <Box tone="green" icon={<BadgeCheck className="size-10" />} title="Genuine EEA certificate">
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
        {rows.map(([k, v]) => <Fragment key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold text-ink">{v}</dd></Fragment>)}
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

export default function VerifyCode({ params }: { params: Promise<{ code: string }> }) {
  return (
    <section className="py-16">
      <div className="container-page space-y-10">
        <Suspense fallback={<p className="text-muted">Checking…</p>}>
          <Result params={params} />
        </Suspense>
        <div>
          <p className="mb-3 text-sm text-muted">Check another certificate</p>
          <VerifyForm />
        </div>
        <p className="text-sm text-muted"><Link href="/verify" className="hover:underline">About certificate verification</Link></p>
      </div>
    </section>
  );
}
