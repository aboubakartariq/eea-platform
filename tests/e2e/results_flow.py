"""Phase 6: roll numbers, admit cards, paper answer sheets, results, certificates, verification, awards. Needs a fresh database."""
import re, subprocess, sys
from datetime import datetime, timedelta, timezone
from openpyxl import Workbook, load_workbook
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, "tests/e2e")
BASE = "http://localhost:3100"; SHOTS = "/tmp/"
DB = "postgres://postgres:devpass@localhost:5433/eea_dev"
TEMP = re.search(r"shown once\): (\S+)", open("tests/e2e/admin.txt").read()).group(1)
totp = lambda s: subprocess.check_output(["node", "tests/e2e/totp.mjs", s]).decode().strip()
sql = lambda q: subprocess.check_output(["psql", DB, "-tAc", q]).decode().strip()
passed = []
def ok(n): passed.append(n); print("PASS", n, flush=True)
SUBMIT = "main button[type=submit]"
PKT = timezone(timedelta(hours=5))

def login(page, ident, pw):
    page.goto(BASE + "/login"); page.fill("input[name=email]", ident); page.fill("input[name=password]", pw); page.click(SUBMIT)

def first_login(page, email, temp, new_pw):
    login(page, email, temp); page.wait_for_url("**/account/password")
    page.fill("input[name=current]", temp); page.fill("input[name=password]", new_pw); page.fill("input[name=confirm]", new_pw); page.click(SUBMIT)
    page.wait_for_url("**/two-factor/setup"); page.click("summary"); sec = page.locator("details code").inner_text().replace(" ", "")
    page.fill("input[name=code]", totp(sec)); page.click(SUBMIT); page.wait_for_url(BASE + "/admin")

QS = (
    [dict(type="Single choice", stem=f"What is {a} × {b}?", opts=[str(a*b-1), str(a*b), str(a*b+2), str(a*b+10)], answer="B", topic="Multiplication", diff="Easy", ans_text=str(a*b)) for a, b in [(3, 4), (6, 7), (8, 9), (5, 12), (7, 11), (9, 9)]]
    + [dict(type="Number", stem=q, opts=[], answer=a, topic="Fractions", diff="Medium", ans_text=a) for q, a in [("What is 1/2 + 1/4 as a decimal?", "0.75"), ("What is 3/4 of 100?", "75")]]
    + [dict(type="True/False", stem="A square has four equal sides.", opts=[], answer="True", topic="Facts", diff="Easy", ans_text="True"),
       dict(type="Short answer", stem="What is the capital city of Pakistan?", opts=[], answer="Islamabad", topic="Facts", diff="Easy", ans_text="islamabad")]
)

def write_questions(path):
    wb = Workbook(); ws = wb.active
    ws.append(["Competition code", "Grade from", "Grade to", "Level", "Type", "Question", "Option A", "Option B", "Option C", "Option D", "Option E", "Option F", "Correct answer", "Tolerance", "Marks", "Difficulty", "Topic", "Tags", "Explanation"])
    for q in QS:
        o = q["opts"] + [""] * (6 - len(q["opts"]))
        ws.append(["MMO", "1", "8", 1, q["type"], q["stem"], *o, q["answer"], "", 1, q["diff"], q["topic"], "", ""])
    wb.save(path)

with sync_playwright() as p:
    PAGES = []
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    def new():
        pg = b.new_context(viewport={"width": 1366, "height": 900}, accept_downloads=True).new_page(); PAGES.append(pg); return pg
    try:
        admin = new(); first_login(admin, "superadmin@test.local", TEMP, "Navy-Star-2026!")
        admin.goto(BASE + "/admin/competitions"); admin.get_by_role("link", name="Mental Math Olympiad").click()
        admin.select_option("select[name=gradeFrom]", "1"); admin.select_option("select[name=gradeTo]", "8"); admin.fill("input[name=feePkr]", "1500")
        admin.fill("input[name=durationMinutes]", "45"); admin.fill("input[name=registrationCloses]", "2027-01-31"); admin.fill("input[name=examDate]", "2027-02-20")
        admin.click(SUBMIT); expect(admin.locator("text=Saved.")).to_be_visible()

        # A second staff member: exam reviewer and result approver
        admin.goto(BASE + "/admin/users/new"); admin.fill("input[name=name]", "Rabia Results"); admin.fill("input[name=email]", "rabia@test.local")
        admin.get_by_label(re.compile("Examination Manager")).check(); admin.get_by_label(re.compile("Result Manager")).check(); admin.click(SUBMIT)
        rtemp = admin.locator("code").first.inner_text()
        rev = new(); first_login(rev, "rabia@test.local", rtemp, "Result-Check-2027!")

        # Questions and a final paper with versions A and B
        write_questions("/tmp/q6.xlsx")
        admin.goto(BASE + "/admin/questions/import"); admin.set_input_files("input[name=file]", "/tmp/q6.xlsx"); admin.click(SUBMIT); expect(admin.locator("text=Imported 10 questions")).to_be_visible()
        admin.goto(BASE + "/admin/questions?status=draft"); admin.locator("thead input[type=checkbox]").check(); admin.get_by_role("button", name="Send for review").click(); expect(admin.locator("text=Sent 10 questions")).to_be_visible()
        rev.goto(BASE + "/admin/questions?status=review"); rev.locator("thead input[type=checkbox]").check(); rev.get_by_role("button", name="Approve").click(); expect(rev.locator("text=Approved 10 questions")).to_be_visible()
        cid = sql("select id from competitions where code='MMO'")
        admin.goto(BASE + f"/admin/exams/papers/new?competition={cid}&gradeFrom=4&gradeTo=6&level=1")
        for i, (n, t) in enumerate([("4", "Multiplication"), ("2", "Fractions"), ("2", "Facts")]):
            admin.fill(f"input[name=bpCount{i}]", n); admin.fill(f"input[name=bpTopic{i}]", t)
        admin.fill("input[name=title]", "MMO 2027 Grades 4-6"); admin.select_option("select[name=printSets]", "2"); admin.click(SUBMIT)
        admin.wait_for_url("**/papers/**created=1"); paper = admin.url.split("/")[-1].split("?")[0]
        admin.get_by_role("button", name="Make final").click(); expect(admin.locator("text=Paper is final")).to_be_visible()
        ok("paper with 8 questions and two printed versions made final")

        # School registers students for the paper exam
        school = new(); school.goto(BASE + "/register/school")
        for k, v in dict(schoolName="Beaconlight Grammar School", principalName="Mrs Principal", officialEmail="office@beacon.test", schoolPhone="042 35761234", city="Lahore", address="12 Canal Road", coordinatorName="Coordinator Beacon", coordinatorPhone="0300 1234567", coordinatorEmail="coord@beacon.test", password="School-Pass-2027", confirm="School-Pass-2027").items():
            school.fill(f"input[name={k}]", v)
        school.check("input[name=consent]"); school.click(SUBMIT); expect(school.locator("text=Registration received")).to_be_visible()
        admin.goto(BASE + "/admin/schools"); admin.get_by_role("link", name="Beaconlight Grammar School").click(); admin.get_by_role("button", name="Approve and issue school ID").click(); expect(admin.locator("text=School ID").first).to_be_visible()
        login(school, "coord@beacon.test", "School-Pass-2027"); school.wait_for_url(BASE + "/school")
        school.goto(BASE + "/school/students/import"); school.set_input_files("input[name=file]", "tests/e2e/class-list.xlsx"); school.click(SUBMIT); school.wait_for_url("**/import/**")
        school.get_by_role("button", name="Import 6 students").click(); expect(school.locator("text=were added to your list")).to_be_visible()
        school.goto(BASE + "/school/register/mental-math-olympiad"); school.get_by_label("Select all shown").check()
        school.locator("input[name=mode][value=paper]").check(); school.click(SUBMIT); school.wait_for_url("**/school/registrations/**"); expect(school.locator("text=Registration submitted")).to_be_visible()
        school_ref = re.search(r"REG-\d{4}-\d+", school.content()).group(0)

        # Parent enters a child online
        parent = new(); parent.goto(BASE + "/register/parent")
        for k, v in dict(name="Hina Saleem", email="hina@example.com", phone="0333 1112223", password="Family-Pass-2027", confirm="Family-Pass-2027").items(): parent.fill(f"input[name={k}]", v)
        parent.check("input[name=consent]"); parent.click(SUBMIT); parent.wait_for_url("**/parent?welcome=1")
        parent.goto(BASE + "/parent/children/new")
        for k, v in dict(firstName="Zara", lastName="Saleem", dateOfBirth="2016-04-03", schoolName="City School").items(): parent.fill(f"input[name={k}]", v)
        parent.select_option("select[name=grade]", "5"); parent.click(SUBMIT); parent.wait_for_url("**added=1"); expect(parent.locator("text=EEA-S-").first).to_be_visible()
        zara_url = parent.url.split("?")[0]; zara_code = re.search(r"EEA-S-\d+", parent.content()).group(0)
        parent.fill("input[name=password]", "zara-exam-2027"); parent.fill("input[name=confirm]", "zara-exam-2027"); parent.click(SUBMIT); expect(parent.locator("text=sign in with student ID")).to_be_visible()
        parent.goto(BASE + "/parent/register"); parent.locator("label:has-text('Zara')").click(); parent.get_by_role("button", name=re.compile("Register")).click()
        parent.wait_for_url("**/parent/registrations/**"); expect(parent.locator("text=Registration submitted")).to_be_visible()
        parent_ref = re.search(r"REG-\d{4}-\d+", parent.content()).group(0)

        # Finance confirms both: roll numbers are issued
        today = datetime.now(PKT).strftime("%Y-%m-%d")
        for ref, amount in [(school_ref, "7500"), (parent_ref, "1500")]:
            admin.goto(BASE + "/admin/registrations"); admin.get_by_role("link", name=ref).click()
            admin.fill("input[name=reference]", f"HBL-{ref[-4:]}"); admin.fill("input[name=amountPkr]", amount); admin.fill("input[name=receivedOn]", today); admin.click(SUBMIT)
            expect(admin.locator("text=Payment recorded")).to_be_visible()
        rolls = sql("select count(*) from registration_items where roll_number ~ '^MMO-27-[0-9]+$'")
        assert rolls == "6", rolls; ok("payment confirmed: 6 roll numbers issued (MMO-27-…)")

        # Admit cards
        school.goto(BASE + "/admit-card/school"); expect(school.locator("article.admit-card")).to_have_count(5)
        expect(school.locator("article.admit-card:has-text('Usman')")).to_contain_text(re.compile(r"Paper version\s*[AB]"))
        expect(school.locator("article.admit-card:has-text('Ali Raza')")).to_contain_text("Given on the day"); ok("school prints 5 admit cards; versions shown where a paper exists")
        school.screenshot(path=SHOTS + "p6_admit_cards.png", full_page=False)
        zara = new(); login(zara, zara_code, "zara-exam-2027"); zara.wait_for_url(BASE + "/student")
        zara.get_by_role("link", name=re.compile("Admit card")).click(); expect(zara.locator("article.admit-card")).to_contain_text("Online"); ok("student opens their own admit card")
        usman_item = sql("select ri.id from registration_items ri join students s on s.id=ri.student_id where s.first_name='Usman'")
        zara.goto(BASE + f"/admit-card/{usman_item}"); expect(zara.locator("text=Page not found").or_(zara.locator("text=could not be found")).first).to_be_visible(); ok("another student's admit card is not found")

        # Zara sits online and answers everything correctly
        start = datetime.now(PKT) - timedelta(minutes=1)
        admin.goto(BASE + "/admin/exams/sessions/new"); admin.select_option("select[name=paperId]", paper); admin.fill("input[name=title]", "Main exam")
        admin.fill("input[name=opensAt]", start.strftime("%Y-%m-%dT%H:%M")); admin.fill("input[name=closesAt]", (start + timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M")); admin.click(SUBMIT); admin.wait_for_url("**/sessions/**created=1")
        zara.goto(BASE + "/student"); zara.get_by_role("button", name="Start exam").click(); zara.wait_for_url("**/student/exam/**")
        answers = {q["stem"]: q for q in QS}
        for i in range(8):
            q = answers[zara.locator("section p[dir=auto]").first.inner_text().strip()]
            if q["type"] in ("Number", "Short answer"): zara.locator("section input[autocomplete=off]").fill(q["ans_text"])
            else: zara.locator(f"section label:has(span:text-is('{q['ans_text']}'))").click()
            if i < 7: zara.get_by_role("button", name="Next").click()
        expect(zara.locator("text=All answers saved")).to_be_visible(timeout=8000)
        zara.get_by_role("button", name="Finish", exact=True).click(); zara.get_by_role("button", name="Submit my answers").click(); expect(zara.locator("text=Your answers have been submitted")).to_be_visible(timeout=10000)

        # Answer keys for versions A and B, from the printable key
        keys = {}
        for v in "AB":
            admin.goto(BASE + f"/admin/exams/papers/{paper}/print?set={v}&key=1")
            keys[v] = [r.locator("td").nth(1).inner_text().strip() for r in admin.locator("tbody tr").all()]
        assert len(keys["A"]) == 8 and keys["A"] != keys["B"], keys

        # Answer sheets: download, fill, upload
        admin.goto(BASE + "/admin/results/answer-sheets"); expect(admin.locator("text=0 of 4 paper entrants entered")).to_be_visible()
        with admin.expect_download() as dl: admin.get_by_role("link", name=re.compile("Answer sheet")).click()
        dl.value.save_as("/tmp/sheet.xlsx"); wb = load_workbook("/tmp/sheet.xlsx"); ws = wb.active
        names = {ws.cell(r, 2).value: r for r in range(2, ws.max_row + 1)}
        assert set(names) == {"Fatima Noor", "Usman Tariq", "Hira Saleem", "Zain Malik"}, names; ok("answer sheet lists the 4 paper entrants in grades 4–6 with roll numbers and versions")
        def fill(name, wrong=0, absent=False):
            r = names[name]; v = ws.cell(r, 5).value
            if absent: ws.cell(r, 6).value = "Yes"; return
            for i, a in enumerate(keys[v]):
                ans = a.split(" / ")[0]
                if i < wrong: ans = "Z" if re.fullmatch(r"[A-D]", ans) else ("False" if ans == "True" else ("True" if ans == "False" else "999"))
                ws.cell(r, 7 + i).value = ans
        fill("Fatima Noor"); fill("Usman Tariq", wrong=0); fill("Hira Saleem", wrong=3); fill("Zain Malik", absent=True)
        # A bad row first: wrong version for Usman
        ws.cell(names["Usman Tariq"], 5).value = "A" if ws.cell(names["Usman Tariq"], 5).value == "B" else "B"; wb.save("/tmp/sheet-bad.xlsx")
        ws.cell(names["Usman Tariq"], 5).value = "A" if ws.cell(names["Usman Tariq"], 5).value == "B" else "B"
        # Turn invalid "Z" letters into a real wrong option so Hira's sheet is valid
        for c in range(7, 15):
            if ws.cell(names["Hira Saleem"], c).value == "Z": ws.cell(names["Hira Saleem"], c).value = "A" if keys[ws.cell(names["Hira Saleem"], 5).value][c - 7] != "A" else "C"
        wb.save("/tmp/sheet.xlsx")
        admin.set_input_files("input[name=file]", "/tmp/sheet-bad.xlsx"); admin.get_by_role("button", name="Upload and mark").click()
        expect(admin.locator("text=Nothing was saved")).to_be_visible(); expect(admin.locator("text=doesn't match the admit card")).to_be_visible()
        assert sql("select count(*) from paper_scripts") == "0"; ok("sheet with a wrong version: nothing saved, row explained")
        admin.set_input_files("input[name=file]", "/tmp/sheet.xlsx"); admin.get_by_role("button", name="Upload and mark").click()
        expect(admin.locator("text=Marked and saved 4 answer sheets (1 absent)")).to_be_visible()
        marks = sql("select s.first_name || ':' || ps.score from paper_scripts ps join registration_items ri on ri.id=ps.registration_item_id join students s on s.id=ri.student_id where not ps.absent order by s.first_name")
        assert marks.split("\n") == ["Fatima:8.00", "Hira:5.00", "Usman:8.00"], marks; ok("paper sheets marked against each version's key: Fatima 8, Usman 8, Hira 5")

        # Calculate, approve (second person), publish
        admin.goto(BASE + "/admin/results"); admin.get_by_role("link", name="Mental Math Olympiad").click()
        admin.get_by_role("button", name="Calculate results").click()
        expect(admin.locator("text=Calculated 6 results (2 absent)")).to_be_visible(); expect(admin.locator("text=1 paper entrant has no answer sheet")).to_be_visible()
        ok("results calculated: 6 entrants, Ali (grade 3, no paper) and Zain absent")
        admin.reload(); admin.get_by_role("link", name="Grade 5").click()
        expect(admin.locator("tbody tr").first).to_contain_text("1 / 2"); expect(admin.locator("tbody tr").nth(1)).to_contain_text("1 / 2"); ok("Zara (online) and Usman (paper) both 8/8 share rank 1 in Grade 5")
        expect(admin.locator("text=You calculated these results")).to_be_visible(); ok("calculator cannot approve their own results")
        assert sql(f"select count(*) from results r join students s on s.id=r.student_id where s.first_name='Ali' and r.absent") == "1"
        rev.goto(BASE + f"/admin/results/{cid}"); rev.get_by_role("button", name="Approve results").click(); expect(rev.locator("text=Approved. They can now be published.")).to_be_visible(); ok("second person approved")
        zara.goto(BASE + "/student"); expect(zara.locator("text=My results")).to_have_count(0); ok("approved but unpublished results are hidden from students")
        admin.reload(); admin.get_by_role("button", name="Publish").click(); expect(admin.locator("text=certificates issued")).to_be_visible()
        assert sql("select count(*) from certificates") == "4"; assert sql("select count(*) from award_dispatches") == "2"
        ok("published: 4 certificates issued, 2 medal parcels (school and parent)")
        admin.screenshot(path=SHOTS + "p6_admin_results.png", full_page=True)

        # Student, parent and school see results
        zara.goto(BASE + "/student"); expect(zara.locator("text=My results")).to_be_visible(); expect(zara.locator("text=Gold Medal").first).to_be_visible(); expect(zara.locator("text=1st").first).to_be_visible()
        expect(zara.locator("text=By topic")).to_be_visible(); ok("student sees score, rank, gold medal and topic breakdown")
        zara.screenshot(path=SHOTS + "p6_student_results.png", full_page=True)
        zara.get_by_role("link", name="Certificate").click(); expect(zara.locator("text=Presented to")).to_be_visible(); expect(zara.locator(".certificate")).to_contain_text("Zara Saleem")
        zara.screenshot(path=SHOTS + "p6_certificate.png", full_page=False)
        code_text = zara.locator("text=Verification code").inner_text(); vcode = re.search(r"([A-Z0-9]{5})-([A-Z0-9]{5})", code_text); vcode = vcode.group(1) + vcode.group(2)
        ok("certificate opens with QR code and verification code")
        parent.goto(zara_url); expect(parent.locator("text=Gold Medal").first).to_be_visible(); ok("parent sees the child's result")
        school.goto(BASE + "/school/results"); expect(school.locator("tbody tr")).to_have_count(5); expect(school.locator("tr:has-text('Usman')")).to_contain_text("Gold Medal")
        expect(school.locator("tr:has-text('Zain')")).to_contain_text("Absent")
        with school.expect_download() as dl: school.get_by_role("link", name="Excel").click()
        dl.value.save_as("/tmp/school-results.xlsx"); assert load_workbook("/tmp/school-results.xlsx").active.max_row == 6; ok("school sees and exports its 5 students' results")
        school.screenshot(path=SHOTS + "p6_school_results.png", full_page=True)
        zara_cert = sql(f"select c.id from certificates c join students s on s.id=c.student_id where s.code='{zara_code}'")
        school.goto(BASE + f"/certificates/{zara_cert}"); expect(school.locator("text=Page not found").or_(school.locator("text=could not be found")).first).to_be_visible(); ok("a school cannot open another family's certificate")

        # Public verification and lookup
        pub = new(); pub.goto(BASE + "/verify"); pub.fill("input[placeholder*='K7Q2M']", f"{vcode[:5]}-{vcode[5:]}"); pub.get_by_role("button", name="Check").click()
        expect(pub.locator("text=Genuine EEA certificate").first).to_be_visible(); expect(pub.locator("text=Zara Saleem").first).to_be_visible(); ok("public verification confirms the certificate")
        pub.screenshot(path=SHOTS + "p6_verify.png", full_page=False)
        pub.goto(BASE + "/verify/ABCDE23456"); expect(pub.locator("text=No certificate found").first).to_be_visible(); ok("unknown code: not found")
        usman_roll = sql("select ri.roll_number from registration_items ri join students s on s.id=ri.student_id where s.first_name='Usman'")
        pub.goto(BASE + "/results"); pub.fill("input[name=roll]", usman_roll); pub.fill("input[name=dob]", "2015-02-11"); pub.click(SUBMIT); expect(pub.locator("text=No published result matches")).to_be_visible()
        pub.fill("input[name=dob]", "2015-02-10"); pub.click(SUBMIT); expect(pub.locator("text=Usman T.")).to_be_visible(); expect(pub.locator("text=Gold Medal")).to_be_visible()
        ok("public lookup needs the right roll number and date of birth")

        # Certificate design and revocation
        admin.goto(BASE + "/admin/certificates"); admin.locator("li:has-text('Mental Math Olympiad')").get_by_role("link", name="Edit").click()
        admin.fill("textarea[name=body]", "Awarded to {nme} for brilliance."); admin.click(SUBMIT); expect(admin.locator("text=must include {name}")).to_be_visible()
        admin.fill("textarea[name=body]", "{name} of {school} is awarded the {award} in the {competition} {year}, {grade}, for outstanding mental maths."); admin.fill("input[name=sigName0]", "Asif Khan")
        admin.click(SUBMIT); expect(admin.locator("text=Saved. Certificates show the new wording")).to_be_visible()
        zara.reload(); expect(zara.locator("text=outstanding mental maths")).to_be_visible(); expect(zara.locator("text=Asif Khan")).to_be_visible(); ok("certificate wording and signatures edited")
        hira_cert = sql("select c.serial from certificates c join students s on s.id=c.student_id where s.first_name='Hira'")
        admin.goto(BASE + f"/admin/certificates?q={hira_cert}"); admin.get_by_role("button", name="Revoke…").click(); admin.fill("input[name=reason]", "Issued in error"); admin.get_by_role("button", name="Revoke", exact=True).click()
        expect(admin.locator(f"tr:has-text('{hira_cert}')")).to_contain_text("Revoked")
        hira_code = sql("select c.verify_code from certificates c join students s on s.id=c.student_id where s.first_name='Hira'")
        pub.goto(BASE + f"/verify/{hira_code}"); expect(pub.locator("text=This certificate has been revoked").first).to_be_visible(); ok("revoked certificate shows as revoked on verification")

        # Awards dispatch
        admin.goto(BASE + "/admin/awards"); row = admin.locator("tr:has-text('Beaconlight')")
        expect(row).to_contain_text("Gold Medal"); row.locator("select[name=status]").select_option("dispatched"); row.get_by_role("button", name="Save").click()
        expect(row.locator("text=Enter the address, courier and tracking")).to_be_visible()
        row.locator("input[name=courier]").fill("TCS"); row.locator("input[name=tracking]").fill("TCS-889201"); row.get_by_role("button", name="Save").click(); expect(row.locator("text=Saved.")).to_be_visible()
        assert sql("select status from award_dispatches where school_id is not null") == "dispatched"; ok("medal parcel for the school dispatched with courier and tracking")

        # Withdraw for correction; reschedule publication for later
        rev.goto(BASE + f"/admin/results/{cid}"); rev.get_by_role("button", name="Withdraw for correction…").click(); rev.fill("textarea[name=reason]", "Paper answer sheet for Hira re-checked"); rev.get_by_role("button", name="Withdraw results").click()
        expect(rev.locator("text=Earlier results were withdrawn: Paper answer sheet for Hira re-checked")).to_be_visible()
        pub.goto(BASE + f"/verify/{vcode}"); expect(pub.locator("text=This certificate has been revoked").first).to_be_visible()
        zara.goto(BASE + "/student"); expect(zara.locator("text=My results")).to_have_count(0); ok("withdrawn results disappear from portals and their certificates are revoked")
        admin.goto(BASE + f"/admin/results/{cid}"); expect(admin.locator("text=Earlier results were withdrawn")).to_be_visible()
        admin.get_by_role("button", name="Calculate results").click(); expect(admin.locator("text=Calculated 6 results")).to_be_visible()
        rev.reload(); rev.get_by_role("button", name="Approve results").click(); expect(rev.locator("text=Approved.")).to_be_visible()
        later = (datetime.now(PKT) + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M")
        rev.select_option("select[name=when]", "later"); rev.fill("input[name=publishAt]", later); rev.get_by_role("button", name="Schedule").click(); expect(rev.locator("text=Scheduled.")).to_be_visible()
        zara.reload(); expect(zara.locator("text=My results")).to_have_count(0); ok("scheduled results stay hidden until their time")
        sql(f"update result_sets set publish_at = now() - interval '1 minute' where status='published'")
        zara.reload(); expect(zara.locator("text=My results")).to_be_visible(); ok("results appear once the scheduled time passes")
        assert sql("select count(*) from audit_logs where action like 'results.%'") == "7"
        ok("every results step is in the audit log")
        b.close()
    except Exception:
        for i, pg in enumerate(PAGES):
            try: pg.screenshot(path=f"/tmp/fail_{i}.png", full_page=True)
            except Exception: pass
        raise

print(f"\n{len(passed)} checks passed")
