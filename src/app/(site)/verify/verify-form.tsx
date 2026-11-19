"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";

export function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial);
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length === 10) router.push(`/verify/${clean}`);
      }}
      className="flex max-w-lg flex-wrap items-end gap-3"
    >
      <label className="min-w-60 flex-1">
        <span className="block text-sm font-semibold text-navy-900">Verification code</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. K7Q2M-X9TPA" autoComplete="off" className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-4 font-mono text-[15px] tracking-wider uppercase outline-none placeholder:normal-case placeholder:tracking-normal focus:border-navy-600" />
        <span className="mt-1.5 block text-xs text-muted">Printed next to the QR code on the certificate.</span>
      </label>
      <button disabled={clean.length !== 10} className={buttonClass("primary", "lg", "disabled:opacity-50")}>Check</button>
    </form>
  );
}
