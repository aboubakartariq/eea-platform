import re, subprocess, time
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3100"; SHOTS = "/tmp/"
TEMP = re.search(r"shown once\): (\S+)", open("tests/e2e/admin.txt").read()).group(1)
totp = lambda s: subprocess.check_output(["node", "tests/e2e/totp.mjs", s]).decode().strip()
passed = []
def ok(n): passed.append(n); print("PASS", n, flush=True)
SUBMIT = "main button[type=submit]"

def school_signup(page, name, email):
    page.goto(BASE + "/register/school")
    for k, v in dict(schoolName=name, principalName="Mrs Principal", officialEmail="office@" + email.split("@")[1], schoolPhone="042 35761234", city="Lahore", address="12 Canal Road",
                     coordinatorName="Coordinator " + name.split()[0], coordinatorPhone="0300 1234567", coordinatorEmail=email, password="School-Pass-2027", confirm="School-Pass-2027").items():
        page.fill(f"input[name={k}]", v)
    page.check("input[name=consent]")
    page.click(SUBMIT); expect(page.locator("text=Registration received")).to_be_visible()

def login(page, email, pw):
    page.goto(BASE + "/login"); page.fill("input[name=email]", email); page.fill("input[name=password]", pw); page.click(SUBMIT)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    admin = b.new_context(viewport={"width": 1366, "height": 900}).new_page()

    # Admin first sign-in
    login(admin, "superadmin@test.local", TEMP); admin.wait_for_url("**/account/password")
    admin.fill("input[name=current]", TEMP); admin.fill("input[name=password]", "Navy-Star-2026!"); admin.fill("input[name=confirm]", "Navy-Star-2026!"); admin.click(SUBMIT)
    admin.wait_for_url("**/two-factor/setup"); admin.click("summary"); sec = admin.locator("details code").inner_text().replace(" ", "")
    admin.fill("input[name=code]", totp(sec)); admin.click(SUBMIT); admin.wait_for_url(BASE + "/admin")

    # Public site shows the 4 real competitions with details TBA
    pub = b.new_context(viewport={"width": 1366, "height": 900}).new_page()
    pub.goto(BASE + "/competitions")
    for n in ["Mental Math Olympiad", "English Olympiad", "Science Olympiad", "Brain Olympiad"]:
        expect(pub.get_by_role("link", name=n)).to_be_visible()
    ok("public site lists the 4 EEA competitions")
    pub.goto(BASE + "/competitions/mental-math-olympiad"); expect(pub.locator("text=To be announced").first).to_be_visible(); ok("missing details shown as 'To be announced'")

    # Admin sets details for Mental Math Olympiad
    admin.goto(BASE + "/admin/competitions"); expect(admin.locator("text=Details missing").first).to_be_visible()
    admin.get_by_role("link", name="Mental Math Olympiad").click()
    admin.select_option("select[name=gradeFrom]", "1"); admin.select_option("select[name=gradeTo]", "8")
    admin.fill("input[name=feePkr]", "1500"); admin.fill("input[name=durationMinutes]", "45")
    admin.fill("input[name=registrationCloses]", "2027-01-31"); admin.fill("input[name=examDate]", "2027-02-20")
    admin.fill("textarea[name=syllabus]", "Grades 1–2: Addition; Subtraction\nGrades 3–5: Times tables; Division")
    admin.click(SUBMIT); expect(admin.locator("text=Saved.")).to_be_visible(); ok("admin saved grades, fee, dates and syllabus")
    admin.select_option("select[name=gradeFrom]", "6"); admin.select_option("select[name=gradeTo]", "2"); admin.click(SUBMIT)
    expect(admin.locator("text=must not be after").first).to_be_visible(); ok("invalid grade range rejected")
    for attempt in range(15):
        pub.goto(BASE + "/competitions/mental-math-olympiad")
        if pub.locator("text=PKR 1,500").count(): break
        time.sleep(1)
    expect(pub.locator("text=PKR 1,500").first).to_be_visible(); expect(pub.locator("text=Times tables")).to_be_visible()
    ok(f"public page shows the new details (after {attempt + 1} load(s))")
    pub.screenshot(path=SHOTS + "p4_public_competition.png", full_page=False)

    # School A registers, can't sign in until approved
    school_signup(pub, "Beaconlight Grammar School", "coord@beacon.test"); ok("school registration submitted")
    login(pub, "coord@beacon.test", "School-Pass-2027"); expect(pub.locator("p[role=alert]")).to_contain_text("being reviewed"); ok("pending school told it is under review")

    admin.goto(BASE + "/admin/schools"); admin.get_by_role("link", name="Beaconlight Grammar School").click()
    admin.get_by_role("button", name="Approve and issue school ID").click()
    expect(admin.locator("text=School ID EEA-LAH-").first).to_be_visible(); ok("admin approval issues a school ID")

    # Coordinator signs in to the school portal
    login(pub, "coord@beacon.test", "School-Pass-2027"); pub.wait_for_url(BASE + "/school"); ok("approved coordinator reaches school portal")
    r = pub.request.get(BASE + "/school/student-template"); assert r.status == 200 and "spreadsheetml" in r.headers["content-type"]; ok("Excel template downloads")

    # Excel import
    pub.goto(BASE + "/school/students/import"); pub.set_input_files("input[name=file]", "tests/e2e/class-list.xlsx"); pub.click(SUBMIT)
    pub.wait_for_url("**/school/students/import/**")
    stats = pub.locator(".tabular-nums").all_inner_texts()[:4]
    assert stats == ["9", "6", "2", "1"], stats; ok("file checked: 9 rows, 6 ready, 2 need fixing, 1 duplicate")
    expect(pub.locator("text=Parent mobile must be a valid number")).to_be_visible(); expect(pub.locator("text=Same student as row 2")).to_be_visible(); ok("row-level problems explained")
    pub.screenshot(path=SHOTS + "p4_import_preview.png", full_page=True)
    pub.get_by_role("button", name="Import 6 students").click(); expect(pub.locator("text=Students added to your list")).to_be_visible(); ok("6 students imported")
    pub.goto(BASE + "/school/students/import"); pub.set_input_files("input[name=file]", "tests/e2e/class-list.xlsx"); pub.click(SUBMIT); pub.wait_for_url("**/import/**")
    stats = pub.locator(".tabular-nums").all_inner_texts()[:4]; assert stats[1] == "0", stats; ok("re-uploading the same file imports nothing new")

    pub.goto(BASE + "/school/students/new")
    for k, v in dict(firstName="Mariam", lastName="Ali", dateOfBirth="2018-04-02", guardianName="Ali Ahmed", guardianPhone="0333 4445556").items(): pub.fill(f"input[name={k}]", v)
    pub.select_option("select[name=grade]", "2"); pub.click(SUBMIT); expect(pub.locator("text=added with student ID EEA-S-")).to_be_visible(); ok("student added manually")
    for k, v in dict(firstName="Fatima", lastName="Noor", dateOfBirth="2016-11-21", guardianName="X Y", guardianPhone="0333 4445556").items(): pub.fill(f"input[name={k}]", v)
    pub.select_option("select[name=grade]", "4"); pub.click(SUBMIT); expect(pub.locator("text=already in your list")).to_be_visible(); ok("manual duplicate blocked")
    pub.goto(BASE + "/school/students"); expect(pub.locator("tbody tr")).to_have_count(7); ok("students list shows 7")

    # Competition registration
    pub.goto(BASE + "/school/register"); pub.get_by_role("link", name=re.compile("Mental Math Olympiad")).click()
    expect(pub.locator("tbody tr")).to_have_count(6); ok("only eligible grades (1–8) offered: 6 of 7 students")
    pub.get_by_label("Select all shown").check(); expect(pub.locator("text=PKR 9,000")).to_be_visible()
    pub.screenshot(path=SHOTS + "p4_register.png", full_page=True)
    pub.click(SUBMIT); pub.wait_for_url("**/school/registrations/**"); expect(pub.locator("text=Registration submitted")).to_be_visible()
    ref = re.search(r"REG-2027-\d+", pub.content()).group(0); ok(f"registration {ref} created, total PKR 9,000")
    reg_url = pub.url.split("?")[0]
    pub.goto(BASE + "/school/register/mental-math-olympiad"); expect(pub.locator("text=Already registered")).to_have_count(6); ok("registered students can't be registered twice")
    pub.goto(BASE + "/school"); pub.screenshot(path=SHOTS + "p4_school_home.png", full_page=True)

    # Isolation: school users can't use the admin, and School B can't see School A's data
    pub.goto(BASE + "/admin"); pub.wait_for_url(BASE + "/school", timeout=8000); expect(pub.locator("text=Welcome, Test")).to_have_count(0); ok("school user sent back to the school portal from /admin")
    other = b.new_context().new_page()
    school_signup(other, "Crescent Model School", "coord@crescent.test")
    admin.goto(BASE + "/admin/schools"); admin.get_by_role("link", name="Crescent Model School").click(); admin.get_by_role("button", name="Approve and issue school ID").click(); expect(admin.locator("text=School ID").first).to_be_visible()
    login(other, "coord@crescent.test", "School-Pass-2027"); other.wait_for_url(BASE + "/school")
    resp = other.goto(reg_url); expect(other.locator("text=Reference")).to_have_count(0); ok("School B gets 'not found' for School A's registration")
    other.goto(BASE + "/school/students"); expect(other.locator("text=No students yet")).to_be_visible(); ok("School B sees none of School A's students")

    # Admin sees it all
    admin.goto(BASE + "/admin/registrations"); expect(admin.locator(f"text={ref}")).to_be_visible(); ok("admin sees the registration")
    admin.goto(BASE + "/admin"); admin.screenshot(path=SHOTS + "p4_admin_dashboard.png", full_page=True)
    admin.goto(BASE + "/admin/audit?q=imported"); expect(admin.locator("text=imported students from Excel").first).to_be_visible(); ok("Excel import recorded in audit log")
    b.close()
print(f"\n{len(passed)} checks passed")
