"use client";

import { useTr } from "@/i18n/app-client";

/** A moment shown in Pakistan time, in the reader's language. */
export function DateTime({ value }: { value: Date | string }) {
  const { intl } = useTr();
  const d = typeof value === "string" ? new Date(value) : value;
  return (
    <time dateTime={d.toISOString()} className="whitespace-nowrap tabular-nums">
      {new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }).format(d)}
    </time>
  );
}
