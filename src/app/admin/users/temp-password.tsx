"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function TempPassword({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl bg-gold-50 p-4 ring-1 ring-gold/30">
      <p className="text-sm font-semibold text-navy-900">Temporary password (shown only once)</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-base text-navy-900 ring-1 ring-line">{value}</code>
        <button type="button" onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))} className="grid size-10 place-items-center rounded-lg bg-white ring-1 ring-line hover:bg-navy-50" aria-label="Copy password">
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Share it privately. The person must change it and set up two-step verification when they first sign in.</p>
    </div>
  );
}
