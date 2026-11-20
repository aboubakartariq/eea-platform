import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

/** Dates are stored as ISO day strings and shown in Pakistan time, in the reader's language (intl). */
export const formatDate = (iso: string, intl = "en-GB") =>
  new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" }).format(new Date(`${iso}T00:00:00+05:00`));
export const formatShortDate = (iso: string, intl = "en-GB") =>
  new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", timeZone: "Asia/Karachi" }).format(new Date(`${iso}T00:00:00+05:00`));
/** A moment (not just a day), e.g. an exam window. */
export const formatDateTime = (d: Date, intl = "en-GB") =>
  new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }).format(d);

export const formatPKR = (amount: number, intl = "en-PK") => `PKR ${amount.toLocaleString(intl.startsWith("ar") ? "en-PK" : intl)}`;
