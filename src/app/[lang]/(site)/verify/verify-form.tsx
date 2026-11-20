"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const { t, href } = useI18n();
  const v = t.verify;
  const [code, setCode] = useState(initial);
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length === 10) router.push(href(`/verify/${clean}`));
      }}
      className="flex max-w-lg flex-wrap items-end gap-3"
    >
      <label className="min-w-60 flex-1">
        <span className="block text-sm font-semibold text-navy-900">{v.code}</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={v.placeholder} dir="ltr" autoComplete="off" className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-4 font-mono text-[15px] tracking-wider uppercase outline-none placeholder:normal-case placeholder:tracking-normal focus:border-navy-600" />
        <span className="mt-1.5 block text-xs text-muted">{v.hint}</span>
      </label>
      <button disabled={clean.length !== 10} className={buttonClass("primary", "lg", "disabled:opacity-50")}>{v.check}</button>
    </form>
  );
}
