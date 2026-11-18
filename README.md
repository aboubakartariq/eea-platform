# EEA Platform

Website and management system for **Educational Extracurricular Activities Pvt. Ltd.**

The full plan (sitemap, architecture, database, roadmap) lives in the *EEA Platform — Phase 1 Plan* doc.

## Status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Research, sitemap, architecture, roadmap | Done (plan doc) |
| 2 | Design system and public website | **In review** |
| 3 | Database, logins, roles, audit log | Not started |
| 4 | School, student and parent portals | Not started |
| 5 | Question bank, paper generator, exam engine | Not started |
| 6 | Results, rankings, certificates, awards | Not started |
| 7 | Payments, finance, messaging, CMS | Not started |
| 8 | Analytics, testing, launch | Not started |

### Phase 2 checklist

- [x] Brand tokens from the Round Seal logo (navy, blue, gold, magenta), Montserrat + Inter
- [x] Header with dropdown and mobile menu, footer, skip link
- [x] Home, About, Competitions (filter by type, mode, grade), competition detail pages
- [x] Olympiads, Extracurricular, For Schools, For Students, Resources, Results, Verify, News, Contact, Register
- [x] Privacy, Terms and Refund pages (drafts for legal review)
- [x] SEO: metadata, sitemap.xml, robots.txt, Organization and Event structured data
- [x] Production build passes; all routes return 200; unknown routes 404
- [ ] Real competitions, fees and dates (currently **sample data**, flagged on the site)
- [ ] Contact details (set through environment variables, hidden until set)
- [ ] Real photos, testimonials and news (sections stay hidden until added)

Forms (contact, registration, result search, certificate lookup) are **not** faked: pages explain when each opens.
They are built in Phases 3–6 with real database operations.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Configuration

Copy these into `.env.local` (all optional during preview):

```
NEXT_PUBLIC_SITE_URL=https://www.example.com
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_CONTACT_WHATSAPP=
NEXT_PUBLIC_CONTACT_ADDRESS=
NEXT_PUBLIC_PREVIEW_NOTICE=on   # set to "off" at launch: removes the banner and allows search indexing
```

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, Motion, Lucide icons.
