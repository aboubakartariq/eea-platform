import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { getTr } from "@/i18n/app-server";

type Props = {
  serial: string; heading: string; awardLabel: string; studentName: string; body: string; competition: string;
  issuedAt: Date; signatories: { name: string; title: string }[]; qrSvg: string; verifyUrl: string; verifyCodeDisplay: string; revoked: boolean;
};

/** A4 landscape certificate. Prints edge to edge; on screen it scales to fit. */
export async function Certificate(p: Props) {
  const { tr, msg, intl } = await getTr();
  const issued = formatDate(p.issuedAt.toISOString().slice(0, 10), intl);
  return (
    <div className="certificate relative mx-auto aspect-[297/210] w-full max-w-[1100px] overflow-hidden bg-white text-ink shadow-xl ring-1 ring-line print:max-w-none print:shadow-none print:ring-0">
      <div className="absolute inset-[2.2%] rounded-[6px] border-[3px] border-navy-700" />
      <div className="absolute inset-[3.4%] rounded-[4px] border border-gold" />
      <div className="absolute top-0 start-0 h-[22%] w-[22%] bg-[radial-gradient(circle_at_0_0,#F7941D33,transparent_70%)]" />
      <div className="absolute end-0 bottom-0 h-[30%] w-[30%] bg-[radial-gradient(circle_at_100%_100%,#EC008C22,transparent_70%)]" />
      {p.revoked && <div className="absolute inset-0 z-10 grid place-items-center"><p className="-rotate-12 rounded-xl border-8 border-red-600 px-10 py-4 text-[5cqw] font-black tracking-widest text-red-600/80">{tr("REVOKED")}</p></div>}
      <div className="relative flex h-full flex-col items-center px-[9%] pt-[5.5%] pb-[4.5%] text-center [container-type:inline-size]">
        <Image src="/brand/eea-seal.svg" alt="" width={120} height={120} className="h-auto w-[9cqw]" priority />
        <p className="mt-[1.2cqw] font-display text-[1.45cqw] font-bold tracking-[0.25em] text-navy-700 uppercase">{tr("Educational Extracurricular Activities")}</p>
        <p className="mt-[2cqw] font-display text-[4.2cqw] leading-none font-bold text-navy-900">{p.heading}</p>
        <p className="mt-[0.8cqw] font-display text-[2.1cqw] font-semibold text-gold-700">{msg(p.awardLabel)}</p>
        <p className="mt-[2.4cqw] text-[1.35cqw] text-muted">{tr("Presented to")}</p>
        <p className="mt-[0.6cqw] border-b-2 border-gold px-[3cqw] pb-[0.6cqw] font-display text-[3.4cqw] font-bold text-navy-900">{p.studentName}</p>
        <p className="mt-[2cqw] max-w-[70cqw] text-[1.5cqw] leading-relaxed">{p.body}</p>
        <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[3cqw]">
          <div className="flex justify-around gap-[2cqw]">
            {p.signatories.map((s, i) => (
              <div key={i} className="min-w-[16cqw] text-center">
                <div className="h-[3.5cqw] border-b border-ink/60" />
                {s.name && <p className="mt-[0.4cqw] text-[1.15cqw] font-semibold">{s.name}</p>}
                <p className="text-[1.05cqw] text-muted">{s.title}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="mx-auto w-[9cqw]" dangerouslySetInnerHTML={{ __html: p.qrSvg }} />
            <p className="mt-[0.4cqw] text-[0.85cqw] text-muted">{tr("Scan to verify")}</p>
          </div>
          <div className="text-end text-[1.05cqw] leading-relaxed text-muted">
            <p>{tr("Certificate no.")}{" "}<span className="font-mono font-semibold text-ink">{p.serial}</span></p>
            <p>{tr("Verification code")}{" "}<span className="font-mono font-semibold text-ink">{p.verifyCodeDisplay}</span></p>
            <p>{tr("Issued {issued}", { issued })}</p>
            <p className="break-all">{p.verifyUrl.replace(/^https?:\/\//, "").replace(/\/[A-Z0-9]+$/, "")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
