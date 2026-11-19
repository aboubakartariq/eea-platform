import re, subprocess, time
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3100"; SHOTS = "/tmp/"
TEMP = re.search(r"shown once\): (\S+)", open("tests/e2e/admin.txt").read()).group(1)
totp = lambda s: subprocess.check_output(["node", "tests/e2e/totp.mjs", s]).decode().strip()
passed = []
def ok(n): passed.append(n); print("PASS", n, flush=True)
SUBMIT = "main button[type=submit]"
def login(page, ident, pw):
    page.goto(BASE + "/login"); page.fill("input[name=email]", ident); page.fill("input[name=password]", pw); page.click(SUBMIT)
def set_comp(admin, name, gf, gt, fee, modes):
    admin.goto(BASE + "/admin/competitions"); admin.get_by_role("link", name=name).click()
    admin.select_option("select[name=gradeFrom]", gf); admin.select_option("select[name=gradeTo]", gt)
    admin.fill("input[name=feePkr]", fee); admin.fill("input[name=registrationCloses]", "2027-01-31"); admin.fill("input[name=examDate]", "2027-02-20")
    for m in ["online", "paper"]:
        box = admin.locator(f"input[name=modes][value={m}]")
        box.check() if m in modes else box.uncheck()
    admin.click(SUBMIT); expect(admin.locator("text=Saved.")).to_be_visible()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    new = lambda: b.new_context(viewport={"width": 1366, "height": 900}).new_page()
    admin = new()
    login(admin, "superadmin@test.local", TEMP); admin.wait_for_url("**/account/password")
    admin.fill("input[name=current]", TEMP); admin.fill("input[name=password]", "Navy-Star-2026!"); admin.fill("input[name=confirm]", "Navy-Star-2026!"); admin.click(SUBMIT)
    admin.wait_for_url("**/two-factor/setup"); admin.click("summary"); sec = admin.locator("details code").inner_text().replace(" ", "")
    admin.fill("input[name=code]", totp(sec)); admin.click(SUBMIT); admin.wait_for_url(BASE + "/admin")
    set_comp(admin, "Mental Math Olympiad", "1", "8", "1500", ["online", "paper"])
    set_comp(admin, "Brain Olympiad", "1", "10", "1200", ["paper"])
    ok("admin opened Mental Math (online + paper) and Brain Olympiad (paper only)")

    # School with students
    school = new(); school.goto(BASE + "/register/school")
    for k, v in dict(schoolName="Beaconlight Grammar School", principalName="Mrs Principal", officialEmail="office@beacon.test", schoolPhone="042 35761234", city="Lahore", address="12 Canal Road", coordinatorName="Coordinator Beacon", coordinatorPhone="0300 1234567", coordinatorEmail="coord@beacon.test", password="School-Pass-2027", confirm="School-Pass-2027").items():
        school.fill(f"input[name={k}]", v)
    school.check("input[name=consent]"); school.click(SUBMIT); expect(school.locator("text=Registration received")).to_be_visible()
    admin.goto(BASE + "/admin/schools"); admin.get_by_role("link", name="Beaconlight Grammar School").click(); admin.get_by_role("button", name="Approve and issue school ID").click(); expect(admin.locator("text=School ID").first).to_be_visible()
    login(school, "coord@beacon.test", "School-Pass-2027"); school.wait_for_url(BASE + "/school")
    school.goto(BASE + "/school/students/import"); school.set_input_files("input[name=file]", "tests/e2e/class-list.xlsx"); school.click(SUBMIT); school.wait_for_url("**/import/**")
    school.get_by_role("button", name="Import 6 students").click(); expect(school.locator("text=were added to your list")).to_be_visible()
    school.goto(BASE + "/school/students?q=Fatima"); fatima_code = school.locator("tbody tr td").first.inner_text().strip()
    ok(f"school imported students; Fatima Noor is {fatima_code}")

    # Parent signs up
    parent = new(); parent.goto(BASE + "/register")
    parent.get_by_role("link", name="Create a parent account").click(); parent.wait_for_url("**/register/parent")
    for k, v in dict(name="Noor Ahmed", email="noor@example.com", phone="12", password="Family-Pass-2027", confirm="Family-Pass-2027").items(): parent.fill(f"input[name={k}]", v)
    parent.check("input[name=consent]"); parent.click(SUBMIT); expect(parent.locator("text=valid mobile number")).to_be_visible(); ok("invalid parent mobile rejected")
    parent.fill("input[name=phone]", "0321 7654321"); parent.fill("input[name=password]", "Family-Pass-2027"); parent.fill("input[name=confirm]", "Family-Pass-2027"); parent.click(SUBMIT)
    parent.wait_for_url("**/parent?welcome=1"); expect(parent.locator("text=Welcome, Noor").first).to_be_visible(); ok("parent signed up and was signed in")

    # Link Fatima
    parent.goto(BASE + "/parent/children/link")
    parent.fill("input[name=studentCode]", fatima_code); parent.fill("input[name=dateOfBirth]", "2016-11-22"); parent.fill("input[name=phone]", "0321 7654321"); parent.click(SUBMIT)
    expect(parent.locator("text=couldn't match")).to_be_visible(); ok("wrong date of birth: link refused")
    parent.fill("input[name=dateOfBirth]", "2016-11-21"); parent.click(SUBMIT); parent.wait_for_url("**linked=1"); expect(parent.locator("text=is now linked")).to_be_visible(); ok("child linked with student ID, date of birth and mobile")

    # Add Bilal as individual entrant
    parent.goto(BASE + "/parent/children/new")
    for k, v in dict(firstName="Bilal", lastName="Ahmed", dateOfBirth="2015-06-01", schoolName="Home-schooled").items(): parent.fill(f"input[name={k}]", v)
    parent.select_option("select[name=grade]", "5"); parent.click(SUBMIT); parent.wait_for_url("**added=1")
    bilal_url = parent.url.split("?")[0]; bilal_code = re.search(r"EEA-S-\d+", parent.content()).group(0); ok(f"individual child added as {bilal_code}")

    # Register both for Mental Math; Brain Olympiad (paper only) not offered
    parent.goto(BASE + "/parent/register")
    expect(parent.get_by_role("heading", name="Brain Olympiad")).to_have_count(0); ok("paper-only competition not offered to parents")
    parent.locator("label:has-text('Fatima')").click(); parent.locator("label:has-text('Bilal')").click()
    expect(parent.get_by_role("button", name=re.compile("PKR 3,000"))).to_be_visible()
    parent.screenshot(path=SHOTS + "p5_parent_register.png", full_page=True)
    parent.get_by_role("button", name=re.compile("Register")).click(); parent.wait_for_url("**/parent/registrations/**"); expect(parent.locator("text=Registration submitted")).to_be_visible(); ok("parent registered 2 children, PKR 3,000")
    school.goto(BASE + "/school/register/mental-math-olympiad"); expect(school.locator("tr:has-text('Fatima Noor')")).to_contain_text("Already registered"); ok("school sees Fatima already registered (no double entry)")

    # Child login
    parent.goto(bilal_url); parent.fill("input[name=password]", "short"); parent.fill("input[name=confirm]", "short"); parent.click(SUBMIT); expect(parent.locator("text=at least 8")).to_be_visible()
    parent.fill("input[name=password]", "bilal-maths-7"); parent.fill("input[name=confirm]", "bilal-maths-7"); parent.click(SUBMIT); expect(parent.locator(f"text=sign in with student ID {bilal_code}")).to_be_visible(); ok("parent created child's login")
    parent.goto(BASE + "/parent"); parent.screenshot(path=SHOTS + "p5_parent_home.png", full_page=True)

    # Student signs in with student ID
    kid = new(); login(kid, bilal_code.lower(), "bilal-maths-7"); kid.wait_for_url(BASE + "/student"); ok("student signs in with student ID (any letter case)")
    expect(kid.locator("text=Mental Math Olympiad")).to_be_visible(); expect(kid.locator("text=days to go")).to_be_visible(); ok("student sees competition and countdown")
    kid.screenshot(path=SHOTS + "p5_student_home.png", full_page=True)
    for path in ["/parent", "/school", "/admin"]:
        kid.goto(BASE + path); kid.wait_for_url(BASE + "/student", timeout=8000)
    ok("student can't open parent, school or admin areas")

    # Coordinator creates a login for Ali
    school.goto(BASE + "/school/students?q=Ali"); school.get_by_role("link", name="Ali Raza").click()
    school.fill("input[name=password]", "ali-raza-12"); school.fill("input[name=confirm]", "ali-raza-12"); school.click(SUBMIT); expect(school.locator("text=can sign in with student ID")).to_be_visible()
    ali_code = re.search(r"EEA-S-\d+", school.locator("main h1 + p").first.inner_text()).group(0)
    kid2 = new(); login(kid2, ali_code, "ali-raza-12"); kid2.wait_for_url(BASE + "/student"); expect(kid2.locator("text=not registered for a competition yet")).to_be_visible(); ok("coordinator-created student login works")

    # Another parent can't see or claim these children
    other = new(); other.goto(BASE + "/register/parent")
    for k, v in dict(name="Someone Else", email="else@example.com", phone="0333 0000000", password="Other-Pass-2027", confirm="Other-Pass-2027").items(): other.fill(f"input[name={k}]", v)
    other.check("input[name=consent]"); other.click(SUBMIT); other.wait_for_url("**/parent?welcome=1")
    other.goto(bilal_url); expect(other.locator(f"text={bilal_code}")).to_have_count(0); ok("another parent gets 'not found' for someone else's child")
    other.goto(BASE + "/parent/children/link"); other.fill("input[name=studentCode]", fatima_code); other.fill("input[name=dateOfBirth]", "2016-11-21"); other.fill("input[name=phone]", "0333 0000000"); other.click(SUBMIT)
    expect(other.locator("text=couldn't match")).to_be_visible(); ok("child can't be claimed without the school's parent mobile")

    admin.goto(BASE + "/admin/registrations"); expect(admin.locator("text=parent Noor Ahmed")).to_be_visible(); ok("admin sees individual registration with parent")
    admin.goto(BASE + "/admin/students?q=Bilal"); expect(admin.locator("text=Individual · Home-schooled")).to_be_visible(); ok("admin sees individual entrant")
    b.close()
print(f"\n{len(passed)} checks passed")
