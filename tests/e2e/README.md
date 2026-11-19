# End-to-end browser tests

Build with a fresh database (public pages are prerendered from it), then run each suite against its own fresh database:

```bash
npm run build && PORT=3100 npm start &
npm run db:migrate && npm run db:seed
ADMIN_EMAIL=superadmin@test.local ADMIN_NAME="Test Super Admin" npm run admin:create > tests/e2e/admin.txt
python3 tests/e2e/school_portal_flow.py      # 25 checks: competitions, school sign-up, approval, Excel import, registration, isolation
```

`results_flow.py` (29 checks: roll numbers, admit cards, paper answer sheets, results, approval, publishing, certificates, verification, awards, withdrawal),
`exam_flow.py` (34 checks: question bank, review, Excel import, paper generator, printing, payment recording, online exam, autosave, recovery, time-out, marking),
`family_portal_flow.py` (19 checks: parent sign-up, linking and adding children, individual registration, student logins, isolation) and `auth_admin_flow.py` (25 checks: sign-in, two-step, lockout, staff permissions, contact form) each need their own fresh database.
Requires Python Playwright, openpyxl, psql and Google Chrome. Never run against production data.
