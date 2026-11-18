import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Karachi",
});
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" });

/** Dates are stored as ISO day strings and shown in Pakistan time. */
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00+05:00`));
export const formatShortDate = (iso: string) => shortFmt.format(new Date(`${iso}T00:00:00+05:00`));

export const formatPKR = (amount: number) => `PKR ${amount.toLocaleString("en-PK")}`;
