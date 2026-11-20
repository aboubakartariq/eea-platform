# EEA Platform

Website and management system for **Educational Extracurricular Activities Pvt. Ltd.**

The full plan (sitemap, architecture, database, roadmap) lives in the *EEA Platform — Phase 1 Plan* doc.

## Status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Research, sitemap, architecture, roadmap | Done (plan doc) |
| 2 | Design system and public website | Done |
| 3 | Database, logins, roles, audit log | Done |
| 4 | School, student and parent portals | Done |
| 5 | Question bank, paper generator, exam engine | Done |
| 6 | Results, rankings, certificates, awards | **In review** |
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

### Phase 3 checklist

- [x] PostgreSQL schema with Drizzle ORM and versioned SQL migrations (`drizzle/`)
- [x] 44 permissions in 15 modules, 11 default roles (`src/lib/auth/permissions.ts`), editable in /admin/roles
- [x] Sign-in with Argon2id password hashing, database sessions in httpOnly cookies (12 h staff, 14 days portals)
- [x] Forced password change for temporary passwords; password policy
- [x] Two-step verification (authenticator app) required for all staff, with replay protection; secrets encrypted with AES-256-GCM
- [x] Rate limits on sign-in, codes and the contact form; account lock for 15 minutes after 5 wrong passwords
- [x] Every page and action checks permissions on the server (`src/lib/auth/dal.ts`)
- [x] Admin: live dashboard, staff users (create, roles, reset password, reset two-step, disable), roles editor, audit log with search, enquiries inbox
- [x] Safeguards: last Super Administrator can't be removed or disabled; only a Super Administrator can create one
- [x] Website contact form saves to the database (validation, honeypot, rate limit)
- [x] Security headers (CSP, HSTS, frame denial)
- [x] Tests: 10 unit tests (`npm test`), 25-step end-to-end browser test of sign-in and admin flows
- [ ] Two-step recovery codes (an administrator can reset two-step verification meanwhile)
- [ ] Password reset by email (needs the email provider, Phase 7)
- [ ] Redis rate limiting and nonce-based CSP before launch

### Phase 4 checklist (school portal)

- [x] EEA's four competitions in the database: Mental Math, English, Science and Brain Olympiads
- [x] Admin competition editor: grades, fee, dates, exam modes, levels, page content; draft / published / archived
- [x] Public competition pages read from the database and refresh when staff save; missing details show "To be announced"
- [x] Registration opens only when a competition is published and has grades, fee, exam date and a future closing date
- [x] School self-registration with coordinator account; pending until approved
- [x] Admin school review: approve (issues school ID such as EEA-LAH-00101), reject, suspend, reinstate
- [x] School portal: overview, students, competition registration, registrations with totals
- [x] Bulk Excel import: template download, upload up to 2,000 rows, every row checked, duplicates detected (in file and against existing students), preview before saving, import history
- [x] Students added one by one; student IDs (EEA-S-…)
- [x] Registration: eligible grades only, select by grade, online or paper mode, reference number (REG-2027-…), fee total; no student registered twice
- [x] Schools see only their own data (tested)
- [x] Admin: schools, students and registrations lists; dashboard figures
- [x] Parent accounts: sign up, link a school-registered child (student ID + date of birth + the parent mobile on the school record), add a child as an individual entrant
- [x] Individual registration by parents for online competitions; one entry per child per competition, whoever registers
- [x] Student logins: username is the student ID, created by a parent or the school coordinator; students sign in with their student ID
- [x] Student portal: competitions, exam dates and countdown, link to the syllabus
- [x] Every account type is kept to its own portal; parents see only their linked children (tested)
- [x] Forms keep what people typed when there is an error
- [ ] Multiple campuses and extra school staff accounts in the portal

### Phase 5 checklist (question bank and exams)

- [x] Question bank: single choice, multiple choice, true/false, number (with allowed margin), short answer; competition, grades, level, topic, difficulty, marks, tags, explanation
- [x] Every save keeps a version; history shows who changed what and the answer at each version
- [x] Review workflow: draft → review → approved; the author of a version cannot approve it (also in bulk); send back with a note; retire and restore
- [x] Editing an approved question makes a new version that needs approval again; papers keep the version they used
- [x] Excel import: template with drop-downs and instructions, up to 1,000 questions, every row checked, nothing imported if any row is wrong, imported as drafts
- [x] Paper generator: pick competition, grades and level, see approved questions by topic and difficulty, build a blueprint, generate at random; shortfalls explained before anything is saved
- [x] Swap one question, pick a new set, make final (locks questions), reopen only while no session uses it
- [x] Negative marking, shuffled question and option order online, up to four printed versions (A–D)
- [x] Printable papers and answer keys (browser Print / Save as PDF); drafts print with a DRAFT mark; answer keys for the exam team only, every view audited
- [x] Online sessions: a window in Pakistan time; only students with paid online registrations in the paper's grades see them
- [x] Exam screen: server-set deadline (paper time, never past the session close), countdown, autosave of every answer, retry when offline, mark for review, question map, review before submit
- [x] Recovery: reloading or reopening continues the same attempt with saved answers; one sitting per student per competition
- [x] Time out: submits automatically; attempts left open are closed and marked by the server
- [x] Automatic marking on submission (scores held back until results are published in Phase 6)
- [x] Staff monitor: eligible, started, writing, submitted; answers saved, last save, times the student left the page; end an attempt
- [x] Manual payment recording (bank transfer, cash, cheque) by finance staff confirms a registration
- [x] Students cannot open another student's attempt or any admin page (tested)
- [ ] Images and formulas in questions (needs file storage)
- [ ] Server-generated PDF files (today: browser Print / Save as PDF)
- [ ] Practice tests for students
- [ ] AI-suggested questions (would always arrive as drafts for human approval)

### Phase 6 checklist (results, certificates, awards)

- [x] Roll numbers (e.g. MMO-27-100245) issued when a registration's payment is confirmed; back-fill for older ones
- [x] Admit cards for students, parents and schools (bulk print for a school); paper-mode cards show the printed version
- [x] Paper answer sheets: per-paper Excel with every entrant's roll number and version, typed answers marked against that version's key, absent students, all-or-nothing upload with row errors
- [x] Results calculated from online exams and paper sheets; absent and missing sheets reported; blocked while students are still writing
- [x] Ranks per grade (score, then accuracy; exact ties share a rank) and within each school; percentages
- [x] Award rules per competition (rank, top %, minimum %, everyone), first match wins
- [x] Approval by a second person, publish now or at a set time, withdraw for correction (revokes its certificates), recalculate
- [x] Certificates issued on publish: A4 landscape, editable wording and signatures per competition, QR code and verification code, print or save as PDF
- [x] Public verification page (genuine / revoked / not found), rate-limited; revoke single certificates with a reason
- [x] Public result lookup with roll number and date of birth, rate-limited
- [x] Student and parent portals: score, rank, school rank, award, topic breakdown, certificate; school portal: results table and Excel export
- [x] Medal parcels created on publish (per school, or per parent for individual entrants); dispatch tracking with courier and tracking number
- [x] Every results step audited; families and schools see only their own students (tested)
- [x] Tests: 40 unit tests; browser tests: results (29 checks), exams (34), school portal (25), parents and students (19), sign-in and admin (25)
- [ ] City and province ranks (needs province on school records)
- [ ] Public list of position holders (needs a consent setting)
- [ ] Emailing and SMS of results and certificates (Phase 7, needs providers)

### Languages checklist

English, Arabic (right-to-left), Malay, Turkish, Japanese, Dutch, French and Russian.

- [x] Public website: every page in all eight languages, with its own address (`/fr/competitions`, English has no prefix), hreflang links and a multilingual sitemap
- [x] Language menu on every page; first-time visitors are sent to their browser's language once, after that their choice is remembered
- [x] Portals for students, parents and schools, the online exam screen, sign-in pages and the admin panel in all eight languages. These keep one address; the saved language choice decides the language
- [x] Messages from forms and actions (errors and confirmations) translated, including messages built with numbers or names
- [x] Policy pages (privacy, terms, refunds) translated, each with a note that the English version applies
- [x] Arabic laid out right to left (logical spacing, flipped arrows) with an Arabic font; Japanese uses system fonts and Japanese line breaking
- [x] Dates in each language; amounts stay in PKR with Western digits
- [ ] Translations checked by native speakers (they were written without one)
- [ ] Policy translations checked by a lawyer
- [ ] Text that staff type in (competition details, question text, news, custom certificate wording) stays in the language it was written in
- [ ] Excel templates and exports stay in English, so imports keep working

How it works: public pages use the dictionaries in `src/i18n/dictionaries/`. Portals and admin use English text as the key (`tr("Sign in")`), with translations in `src/i18n/app/{portal,admin}.{lang}.json`; any text without a translation falls back to English.

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill in DATABASE_URL and APP_ENCRYPTION_KEY
npm run db:migrate              # create tables
npm run db:seed                 # permissions and default roles (safe to re-run)
ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" npm run admin:create   # first Super Administrator
npm run dev                     # http://localhost:3000, sign in at /login
npm test                        # unit tests
```

The admin script prints a one-time temporary password. At first sign-in you choose a new
password and set up two-step verification with an authenticator app.

## Configuration

See `.env.example`. Required: `DATABASE_URL`, `APP_ENCRYPTION_KEY`. Optional:

```
NEXT_PUBLIC_SITE_URL=https://www.example.com
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_CONTACT_WHATSAPP=
NEXT_PUBLIC_CONTACT_ADDRESS=
NEXT_PUBLIC_PREVIEW_NOTICE=on   # set to "off" at launch: removes the banner and allows search indexing
```

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, Motion, Lucide icons,
PostgreSQL with Drizzle ORM, Argon2id, otplib, Zod, Vitest.
