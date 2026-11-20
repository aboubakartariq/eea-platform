import re, subprocess, sys, time
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3100"
TEMP = re.search(r"shown once\): (\S+)", open("tests/e2e/admin.txt").read()).group(1)
SHOTS = "/tmp/"
results = []
def ok(name): results.append(("PASS", name)); print("PASS", name, flush=True)
def totp(secret): return subprocess.check_output(["node", "tests/e2e/totp.mjs", secret]).decode().strip()

def first_login(page, email, temp, newpw):
    page.goto(BASE + "/login")
    page.fill("input[name=email]", email); page.fill("input[name=password]", temp)
    page.click("main button[type=submit]")
    page.wait_for_url("**/account/password")
    page.fill("input[name=current]", temp); page.fill("input[name=password]", newpw); page.fill("input[name=confirm]", newpw)
    page.click("main button[type=submit]")
    page.wait_for_url("**/account/two-factor/setup")
    page.click("summary")
    secret = page.locator("details code").inner_text()
    page.fill("input[name=code]", totp(secret)); page.click("main button[type=submit]")
    page.wait_for_url(BASE + "/admin")
    return secret.replace(" ", "")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    ctx = b.new_context(viewport={"width": 1366, "height": 860})
    page = ctx.new_page()

    # 1. Protected pages redirect when signed out
    page.goto(BASE + "/admin/users"); page.wait_for_url("**/login"); ok("signed-out visitor sent to /login")

    # 2. Wrong password gives a generic error
    page.fill("input[name=email]", "superadmin@test.local"); page.fill("input[name=password]", "wrong-password-1")
    page.click("main button[type=submit]"); expect(page.locator("p[role=alert]")).to_contain_text("don't match"); ok("wrong password rejected with generic message")

    # 3. First sign-in: forced password change, then forced 2FA setup
    page.goto(BASE + "/login")
    page.fill("input[name=email]", "superadmin@test.local"); page.fill("input[name=password]", TEMP)
    page.click("main button[type=submit]"); page.wait_for_url("**/account/password"); ok("temporary password forces a password change")
    page.goto(BASE + "/admin"); page.wait_for_url("**/account/password"); ok("admin blocked until password changed")
    page.fill("input[name=current]", TEMP); page.fill("input[name=password]", "short"); page.fill("input[name=confirm]", "short")
    page.click("main button[type=submit]"); expect(page.locator("text=Use at least 10 characters")).to_be_visible(); ok("weak new password rejected")
    page.fill("input[name=current]", TEMP); page.fill("input[name=password]", "Navy-Star-2026!"); page.fill("input[name=confirm]", "Navy-Star-2026!")
    page.click("main button[type=submit]"); page.wait_for_url("**/account/two-factor/setup"); ok("staff forced to set up two-step verification")
    page.screenshot(path=SHOTS + "e2e_2fa_setup.png", full_page=True)
    page.click("summary"); secret = page.locator("details code").inner_text().replace(" ", "")
    page.fill("input[name=code]", "123456"); page.click("main button[type=submit]")
    expect(page.locator("p[role=alert]")).to_contain_text("isn't right"); ok("wrong two-step code rejected")
    page.fill("input[name=code]", totp(secret)); page.click("main button[type=submit]"); page.wait_for_url(BASE + "/admin"); ok("two-step set up, dashboard reached")
    expect(page.get_by_role("heading", name=re.compile("Welcome"))).to_be_visible()
    page.screenshot(path=SHOTS + "e2e_dashboard.png", full_page=True)

    # 4. Create a Competition Manager
    page.goto(BASE + "/admin/users/new")
    page.fill("input[name=name]", "Sara Competition"); page.fill("input[name=email]", "sara@test.local")
    page.get_by_label(re.compile("Competition Manager")).check()
    page.click("main button[type=submit]")
    temp2 = page.locator("code").first.inner_text(); assert re.match(r"^[a-z]+-[a-z]+-\d{4}$", temp2), temp2
    ok("staff member created with one-time temporary password")
    page.goto(BASE + "/admin/users/new")
    page.fill("input[name=name]", "Dup"); page.fill("input[name=email]", "SARA@test.local"); page.get_by_label(re.compile("Finance Manager")).check()
    page.click("main button[type=submit]"); expect(page.locator("text=already exists")).to_be_visible(); ok("duplicate email (case-insensitive) blocked")
    page.goto(BASE + "/admin/users"); page.screenshot(path=SHOTS + "e2e_users.png", full_page=True)

    # 5. Contact form from the public site
    pub = ctx.new_page()
    pub.goto(BASE + "/contact")
    pub.click("button[type=submit]"); expect(pub.locator("text=Enter your name.")).to_be_visible(); ok("contact form validates input")
    pub.fill("input[name=name]", "Ayesha Parent"); pub.fill("input[name=email]", "ayesha@example.com")
    pub.locator("label:has-text('Parent')").click()
    pub.fill("input[name=subject]", "Grade 4 maths olympiad"); pub.fill("textarea[name=message]", "Can my daughter register individually for the maths olympiad?")
    pub.click("button[type=submit]"); expect(pub.locator("text=your message has been sent")).to_be_visible(); ok("contact form saved")
    pub.screenshot(path=SHOTS + "e2e_contact.png", full_page=False)
    page.goto(BASE + "/admin/enquiries"); expect(page.locator("text=Grade 4 maths olympiad")).to_be_visible(); ok("enquiry visible in admin")
    page.get_by_role("button", name="Mark as: In progress").click(); page.wait_for_timeout(800)
    page.goto(BASE + "/admin/enquiries?status=in_progress"); expect(page.locator("text=Grade 4 maths olympiad")).to_be_visible(); ok("enquiry status updated")

    # 6. Role editor
    page.goto(BASE + "/admin/roles"); page.get_by_role("link", name="Super Administrator").click()
    expect(page.locator("text=always has every permission").first).to_be_visible(); ok("super admin role is locked")

    # 7. Sign out; sign in as Competition Manager; permissions enforced
    page.get_by_role("button", name="Sign out").click(); page.wait_for_url("**/login"); ok("sign out")
    page.goto(BASE + "/admin"); page.wait_for_url("**/login"); ok("session cleared after sign out")
    ctx2 = b.new_context(viewport={"width": 1366, "height": 860}); m = ctx2.new_page()
    first_login(m, "sara@test.local", temp2, "Gold-Medal-2027?")
    ok("second staff member completed first sign-in")
    expect(m.get_by_role("link", name="Users")).to_have_count(0); ok("sidebar hides modules without permission")
    m.goto(BASE + "/admin/users"); m.wait_for_url("**/admin/no-access**"); ok("direct URL to /admin/users denied")
    m.goto(BASE + "/admin/audit"); m.wait_for_url("**/admin/no-access**"); ok("direct URL to /admin/audit denied")
    m.screenshot(path=SHOTS + "e2e_noaccess.png", full_page=True)
    ctx2.close()

    # 8. Lockout after 5 wrong passwords
    ctx3 = b.new_context(); l = ctx3.new_page()
    for i in range(5):
        l.goto(BASE + "/login"); l.fill("input[name=email]", "sara@test.local"); l.fill("input[name=password]", f"wrong-{i}-password"); l.click("button[type=submit]")
        l.locator("p[role=alert]").wait_for()
    expect(l.locator("p[role=alert]")).to_contain_text("locked"); ok("account locks after 5 failed attempts")
    l.goto(BASE + "/login"); l.fill("input[name=email]", "sara@test.local"); l.fill("input[name=password]", "Gold-Medal-2027?"); l.click("button[type=submit]")
    expect(l.locator("p[role=alert]")).to_contain_text("locked"); ok("correct password refused while locked")
    ctx3.close()

    # 9. Super admin signs back in with 2FA and checks the audit log
    page.goto(BASE + "/login"); page.fill("input[name=email]", "superadmin@test.local"); page.fill("input[name=password]", "Navy-Star-2026!"); page.click("main button[type=submit]")
    page.wait_for_url("**/login/verify"); ok("returning staff asked for two-step code")
    time.sleep(31)  # new time step, so the earlier code can't be replayed
    page.fill("input[name=code]", totp(secret)); page.click("main button[type=submit]"); page.wait_for_url(BASE + "/admin")
    page.goto(BASE + "/admin/audit"); expect(page.locator("text=was locked out").first).to_be_visible(); ok("audit log records lockout")
    page.screenshot(path=SHOTS + "e2e_audit.png", full_page=False)
    b.close()

print(f"\n{len(results)} checks passed")
