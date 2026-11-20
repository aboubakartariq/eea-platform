/**
 * Site-wide settings. In Phase 7 these move into the admin CMS (Website settings).
 * Contact details are left empty until the company provides them: the UI hides
 * anything that is not set rather than showing invented numbers.
 */
export const site = {
  name: "Educational Extracurricular Activities",
  shortName: "EEA",
  legalName: "Educational Extracurricular Activities Pvt. Ltd.",
  tagline: "Competitions that help every student shine",
  description:
    "Educational Extracurricular Activities organises olympiads and extracurricular competitions for schools and students across Pakistan, online and on paper, with fair rankings and verifiable certificates.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  copyrightYear: 2026,
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
    whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "",
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "",
  },
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "",
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "",
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? "",
  },
  /** Shown while competitions on the site are sample data, not real events. */
  previewNotice: process.env.NEXT_PUBLIC_PREVIEW_NOTICE !== "off",
} as const;

export type NavItem = { label: string; href: string; children?: NavItem[]; description?: string };


