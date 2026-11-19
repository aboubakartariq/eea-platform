import "server-only";
import QRCode from "qrcode";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { gradeName } from "@/lib/competition-types";
import { site } from "@/lib/site";
import { formatVerifyCode } from "./results";

export const DEFAULT_TEMPLATE = {
  heading: "Certificate",
  body: "This is to certify that {name} of {school} has been awarded the {award} in the {competition} {year}, {grade}.",
  signatories: [{ name: "", title: "Chief Executive" }, { name: "", title: "Controller of Examinations" }],
};

export const verifyUrl = (code: string) => `${site.url.replace(/\/$/, "")}/verify/${code}`;

/** Everything printed on a certificate, or null if it doesn't exist. */
export async function certificateView(id: string) {
  const [c] = await db
    .select({
      cert: schema.certificates,
      competition: schema.competitions.name,
      examDate: schema.competitions.examDate,
      visible: sql<boolean>`${schema.resultSets.status} = 'published' and ${schema.resultSets.publishAt} <= now()`,
    })
    .from(schema.certificates)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.certificates.competitionId))
    .innerJoin(schema.results, eq(schema.results.id, schema.certificates.resultId))
    .innerJoin(schema.resultSets, eq(schema.resultSets.id, schema.results.resultSetId))
    .where(eq(schema.certificates.id, id));
  if (!c) return null;
  const tpl = (await db.query.certificateTemplates.findFirst({ where: eq(schema.certificateTemplates.competitionId, c.cert.competitionId) })) ?? DEFAULT_TEMPLATE;
  const year = (c.examDate ?? c.cert.issuedAt.toISOString()).slice(0, 4);
  const fill = (s: string) =>
    s
      .replaceAll("{name}", c.cert.studentName)
      .replaceAll("{school}", c.cert.schoolName ?? "an individual entry")
      .replaceAll("{award}", c.cert.awardLabel)
      .replaceAll("{competition}", c.competition)
      .replaceAll("{year}", year)
      .replaceAll("{grade}", gradeName(c.cert.grade));
  const url = verifyUrl(c.cert.verifyCode);
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 0, color: { dark: "#1f2266", light: "#ffffff00" } });
  return {
    ...c.cert,
    competition: c.competition,
    visible: c.visible,
    heading: tpl.heading,
    body: fill(tpl.body),
    signatories: tpl.signatories.filter((s) => s.title || s.name),
    verifyUrl: url,
    verifyCodeDisplay: formatVerifyCode(c.cert.verifyCode),
    qrSvg,
  };
}

/** Public lookup by the code in the QR link. Only certificates whose results are published. */
export async function verifyLookup(code: string) {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length !== 10) return null;
  const [c] = await db
    .select({ cert: schema.certificates, competition: schema.competitions.name, examDate: schema.competitions.examDate })
    .from(schema.certificates)
    .innerJoin(schema.competitions, eq(schema.competitions.id, schema.certificates.competitionId))
    .innerJoin(schema.results, eq(schema.results.id, schema.certificates.resultId))
    .innerJoin(schema.resultSets, eq(schema.resultSets.id, schema.results.resultSetId))
    .where(and(eq(schema.certificates.verifyCode, clean), sql`(${schema.resultSets.status} in ('published','withdrawn')) and ${schema.resultSets.publishAt} <= now()`));
  return c ?? null;
}
