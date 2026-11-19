import QRCode from "qrcode";
import { site } from "@/lib/site";

/** A small, clearly-labelled sample certificate; its QR opens the real verification page. */
export async function CertificateSample() {
  const url = `${site.url.replace(/\/$/, "")}/verify`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 0, color: { dark: "#1B1D63", light: "#ffffff00" } });
  return (
    <figure className="relative mx-auto w-full max-w-md rotate-[-2deg] rounded-xl bg-white p-2 shadow-[0_40px_80px_-30px_rgba(27,29,99,0.45)] ring-1 ring-navy-100">
      <div className="rounded-lg border-2 border-navy-700 p-1.5">
        <div className="flex flex-col items-center rounded-md border border-gold px-6 pt-6 pb-5 text-center">
          <p className="font-display text-[10px] font-bold tracking-[0.2em] text-navy-700">EDUCATIONAL EXTRACURRICULAR ACTIVITIES</p>
          <p className="mt-3 font-display text-2xl font-bold text-navy-900">Certificate</p>
          <p className="font-display text-sm font-semibold text-gold-700">Gold Medal</p>
          <p className="mt-3 text-[11px] text-muted">Presented to</p>
          <p className="border-b border-gold px-4 pb-1 font-display text-lg font-bold text-navy-900">Student name</p>
          <div className="mt-5 flex w-full items-end justify-between gap-4 text-left">
            <div className="text-[10px] leading-relaxed text-muted">
              <p>Certificate no. <span className="font-semibold text-ink">EEA-C-27-…</span></p>
              <p>Verification code <span className="font-semibold text-ink">XXXXX-XXXXX</span></p>
            </div>
            <div className="w-16 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />
          </div>
        </div>
      </div>
      <figcaption className="sr-only">Sample certificate showing where the certificate number, verification code and QR code appear.</figcaption>
    </figure>
  );
}
