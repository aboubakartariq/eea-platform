# End-to-end browser tests

Run against a production build on port 3100 with a fresh database:

```bash
npm run build && PORT=3100 npm start &
npm run db:migrate && npm run db:seed
ADMIN_EMAIL=superadmin@test.local ADMIN_NAME="Test Super Admin" npm run admin:create > tests/e2e/admin.txt
python3 tests/e2e/school_portal_flow.py      # 25 checks: competitions, school sign-up, approval, Excel import, registration, isolation
```

`auth_admin_flow.py` (25 checks: sign-in, two-step, lockout, staff permissions, contact form) needs its own fresh database.
Requires Python Playwright and Google Chrome. Never run against production data.
