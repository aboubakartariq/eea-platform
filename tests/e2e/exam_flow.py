"""Phase 5: question bank, paper generator and online exam, end to end. Needs a fresh database."""
import re, subprocess, time
from datetime import datetime, timedelta, timezone
from openpyxl import Workbook
from playwright.sync_api import sync_playwright, expect

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

# The question set. Answers are by option text so the test can answer whatever order the screen shows.
QS = (
    [dict(type="Single choice", stem=f"What is {a} × {b}?", opts=[str(a*b-1), str(a*b), str(a*b+2), str(a*b+10)], answer="B", topic="Multiplication", diff="Easy", ans_text=str(a*b)) for a, b in [(3, 4), (6, 7), (8, 9), (5, 12), (7, 11)]]
    + [dict(type="Single choice", stem=f"Which fraction equals {n}/{d*2} simplified?", opts=[f"{n}/{d}", f"{n+1}/{d}", f"{n}/{d+1}"], answer="A", topic="Fractions", diff="Medium", ans_text=f"{n}/{d}") for n, d in [(1, 3), (2, 5), (3, 7)]]
    + [dict(type="Number", stem=q, opts=[], answer=a, topic="Fractions", diff="Medium", ans_text=a) for q, a in [("What is 1/2 + 1/4 as a decimal?", "0.75"), ("What is 3/4 of 100?", "75")]]
    + [dict(type="Multiple choice", stem="Which of these are even numbers?", opts=["14", "21", "38", "45"], answer="A, C", topic="Patterns", diff="Medium", ans_text=["14", "38"])]
    + [dict(type="True/False", stem="A square has four equal sides.", opts=[], answer="True", topic="Facts", diff="Easy", ans_text="True"),
       dict(type="Short answer", stem="What is the capital city of Pakistan?", opts=[], answer="Islamabad", topic="Facts", diff="Easy", ans_text="islamabad")]
)

def write_sheet(path, rows, bad=False):
    wb = Workbook(); ws = wb.active
    ws.append(["Competition code", "Grade from", "Grade to", "Level", "Type", "Question", "Option A", "Option B", "Option C", "Option D", "Option E", "Option F", "Correct answer", "Tolerance", "Marks", "Difficulty", "Topic", "Tags", "Explanation"])
    for q in rows:
        o = q["opts"] + [""] * (6 - len(q["opts"]))
        ws.append(["MMO", "1", "8", 1, q["type"], q["stem"], *o, q["answer"], "", 1, q["diff"], q["topic"], "", ""])
    if bad:
        ws.append(["XYZ", "1", "8", 1, "Single choice", "Broken row", "1", "", "", "", "", "", "C", "", 1, "Easy", "Misc", "", ""])
    wb.save(path)

with sync_playwright() as p:
    PAGES = []
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    def new():
        pg = b.new_context(viewport={"width": 1366, "height": 900}).new_page(); PAGES.append(pg); return pg
    try:
        admin = new(); first_login(admin, "superadmin@test.local", TEMP, "Navy-Star-2026!")

        # Open Mental Math for online registration
        admin.goto(BASE + "/admin/competitions"); admin.get_by_role("link", name="Mental Math Olympiad").click()
        admin.select_option("select[name=gradeFrom]", "1"); admin.select_option("select[name=gradeTo]", "8"); admin.fill("input[name=feePkr]", "1500")
        admin.fill("input[name=durationMinutes]", "45"); admin.fill("input[name=registrationCloses]", "2027-01-31"); admin.fill("input[name=examDate]", "2027-02-20")
        admin.click(SUBMIT); expect(admin.locator("text=Saved.")).to_be_visible()

        # A reviewer (Examination Manager)
        admin.goto(BASE + "/admin/users/new"); admin.fill("input[name=name]", "Rehan Reviewer"); admin.fill("input[name=email]", "rehan@test.local")
        admin.get_by_label(re.compile("Examination Manager")).check(); admin.click(SUBMIT)
        rtemp = admin.locator("code").first.inner_text()
        rev = new(); first_login(rev, "rehan@test.local", rtemp, "Exam-Review-2027!"); ok("reviewer (Examination Manager) signed in with two-step")

        # 1. Write a question by hand
        admin.goto(BASE + "/admin/questions"); expect(admin.locator("text=The question bank is empty")).to_be_visible()
        admin.goto(BASE + "/admin/questions/new")
        admin.select_option("select[name=competitionId]", label="Mental Math Olympiad"); admin.select_option("select[name=gradeFrom]", "1"); admin.select_option("select[name=gradeTo]", "8")
        admin.fill("input[name=topic]", "Multiplication"); admin.select_option("select[name=difficulty]", "easy")
        admin.fill("textarea[name=stem]", "What is 9 × 9?"); admin.fill("input[name=optA]", "81"); admin.fill("input[name=optB]", "72"); admin.fill("input[name=optC]", "99")
        admin.click(SUBMIT); expect(admin.locator("text=Choose exactly one correct option")).to_be_visible()
        expect(admin.locator("input[name=optB]")).to_have_value("72"); ok("question without a correct answer rejected; typed options kept")
        admin.locator("input[name=correct][value=A]").check(); admin.click(SUBMIT); admin.wait_for_url("**saved=1")
        q1 = admin.url.split("/")[-1].split("?")[0]
        expect(admin.locator("text=Question saved as a draft")).to_be_visible(); ok("question saved as draft, version 1")
        admin.get_by_role("button", name="Send for review").click(); expect(admin.locator("text=Sent for review.")).to_be_visible()
        admin.reload(); expect(admin.get_by_role("button", name="Approve")).to_have_count(0); expect(admin.locator("text=another reviewer must approve")).to_be_visible()
        ok("author cannot approve their own question")
        rev.goto(BASE + f"/admin/questions/{q1}"); rev.get_by_role("button", name="Approve").click(); expect(rev.locator("text=Approved. It can now be used")).to_be_visible(); ok("reviewer approved it")
        admin.goto(BASE + f"/admin/questions/{q1}"); admin.fill("input[name=optC]", "90"); admin.click(SUBMIT)
        expect(admin.locator("text=Saved as version 2")).to_be_visible(); expect(admin.locator("text=needs approving again")).to_be_visible()
        rev.goto(BASE + f"/admin/questions/{q1}"); expect(rev.locator("text=Version 2").first).to_be_visible(); ok("editing an approved question makes version 2 and needs re-approval")
        admin.get_by_role("button", name="Send for review").click(); expect(admin.locator("text=Sent for review.")).to_be_visible()
        rev.reload(); rev.get_by_role("button", name="Send back…").click(); rev.get_by_role("button", name="Send back with note").click(); expect(rev.locator("text=Write a note")).to_be_visible()
        rev.fill("textarea[name=note]", "Option C should be 91 to be a closer distractor."); rev.get_by_role("button", name="Send back with note").click(); expect(rev.locator("text=Sent back to the author")).to_be_visible()
        admin.reload(); expect(admin.locator("text=closer distractor")).to_be_visible(); ok("reviewer sent it back with a note the author sees")
        admin.fill("input[name=optC]", "91"); admin.click(SUBMIT); expect(admin.locator("text=Saved as version 3")).to_be_visible()
        admin.get_by_role("button", name="Send for review").click(); expect(admin.locator("text=Sent for review.")).to_be_visible()
        rev.reload(); rev.get_by_role("button", name="Approve").click(); expect(rev.locator("text=Approved.")).to_be_visible()

        # 2. Excel import: one bad row blocks the file, then a clean file imports
        write_sheet("/tmp/questions-bad.xlsx", QS, bad=True); write_sheet("/tmp/questions.xlsx", QS)
        admin.goto(BASE + "/admin/questions/import"); admin.set_input_files("input[name=file]", "/tmp/questions-bad.xlsx"); admin.click(SUBMIT)
        expect(admin.locator("text=Nothing was imported")).to_be_visible(); expect(admin.locator('text=Competition code "XYZ" is not recognised')).to_be_visible()
        assert sql("select count(*) from questions") == "1"; ok("file with a bad row: nothing imported, row explained")
        admin.set_input_files("input[name=file]", "/tmp/questions.xlsx"); admin.click(SUBMIT); expect(admin.locator(f"text=Imported {len(QS)} questions as drafts")).to_be_visible(); ok(f"{len(QS)} questions imported from Excel as drafts")
        admin.goto(BASE + "/admin/questions?status=draft"); admin.locator("thead input[type=checkbox]").check(); admin.get_by_role("button", name="Send for review").click()
        expect(admin.locator(f"text=Sent {len(QS)} questions for review")).to_be_visible()
        admin.goto(BASE + "/admin/questions?status=review"); admin.locator("thead input[type=checkbox]").check(); admin.get_by_role("button", name="Approve").click()
        expect(admin.locator("text=You wrote these questions")).to_be_visible(); ok("bulk approve skips your own questions")
        rev.goto(BASE + "/admin/questions?status=review"); rev.locator("thead input[type=checkbox]").check(); rev.get_by_role("button", name="Approve").click()
        expect(rev.locator(f"text=Approved {len(QS)} questions")).to_be_visible(); ok("reviewer bulk-approved the import")
        rev.goto(BASE + "/admin/questions"); rev.screenshot(path=SHOTS + "p5_question_bank.png", full_page=True)

        # 3. Paper from a blueprint
        cid = sql("select id from competitions where code='MMO'")
        admin.goto(BASE + f"/admin/exams/papers/new?competition={cid}&gradeFrom=4&gradeTo=6&level=1")
        expect(admin.locator("text=: 14")).to_be_visible()
        rows = [("4", "Multiplication", "easy"), ("9", "Fractions", "medium"), ("2", "Facts", "easy"), ("1", "Patterns", "")]
        for i, (n, t, d) in enumerate(rows):
            admin.fill(f"input[name=bpCount{i}]", n); admin.fill(f"input[name=bpTopic{i}]", t); admin.select_option(f"select[name=bpDifficulty{i}]", d)
        admin.fill("input[name=title]", "Mental Math Olympiad 2027 — Grades 4–6"); admin.fill("input[name=negativePercent]", "25")
        admin.click(SUBMIT); expect(admin.locator("text=Row 2 needs 9 medium Fractions questions but only 5 are available")).to_be_visible()
        expect(admin.locator("input[name=bpCount0]")).to_have_value("4"); ok("blueprint shortfall explained; nothing saved")
        admin.fill("input[name=bpCount1]", "3"); admin.screenshot(path=SHOTS + "p5_blueprint.png", full_page=True); admin.click(SUBMIT)
        admin.wait_for_url("**/papers/**created=1"); paper = admin.url.split("/")[-1].split("?")[0]
        expect(admin.locator("text=Paper generated with 10 questions")).to_be_visible(); ok("paper generated: 10 questions from the blueprint")
        first_stem = admin.locator("tbody tr").first.locator("td").nth(1).locator("p").first.inner_text()
        admin.locator("tbody tr").first.get_by_role("button", name="Swap").click(); expect(admin.locator("tbody tr").first.locator("td").nth(1).locator("p").first).not_to_have_text(first_stem); ok("one question swapped for another of the same topic and difficulty")
        admin.get_by_role("button", name="Make final").click(); expect(admin.locator("text=Paper is final")).to_be_visible()
        expect(admin.get_by_role("button", name="Swap")).to_have_count(0); ok("paper made final; questions locked")
        # Edit a question on the paper: the final paper keeps its version
        on_paper = sql(f"select question_id || ' ' || question_version from paper_questions where paper_id='{paper}' and snapshot->>'topic'='Facts' and snapshot->>'type'='short'").split()
        admin.goto(BASE + f"/admin/questions/{on_paper[0]}"); admin.fill("textarea[name=explanation]", "Islamabad has been the capital since 1967."); admin.click(SUBMIT); expect(admin.locator("text=Saved as version 2")).to_be_visible()
        assert sql(f"select question_version from paper_questions where paper_id='{paper}' and question_id='{on_paper[0]}'") == on_paper[1]; ok("editing a bank question does not change the final paper")
        rev.goto(BASE + f"/admin/questions/{on_paper[0]}"); rev.get_by_role("button", name="Send for review").click(); rev.wait_for_timeout(300)
        pr = new(); pr.context.add_cookies(admin.context.cookies())
        pr.goto(BASE + f"/admin/exams/papers/{paper}/print?set=B"); expect(pr.locator("text=Version B").first).to_be_visible();
        pr.screenshot(path=SHOTS + "p5_print_B.png", full_page=True)
        pr.goto(BASE + f"/admin/exams/papers/{paper}/print?set=B&key=1"); expect(pr.locator("text=Answer key").first).to_be_visible(); ok("printable version B and its answer key")
        assert sql("select count(*) from audit_logs where action='paper.answer_key_viewed'") == "1"; ok("viewing an answer key is audited")

        # 4. Parent registers two children online; finance confirms payment
        parent = new(); parent.goto(BASE + "/register/parent")
        for k, v in dict(name="Hina Saleem", email="hina@example.com", phone="0333 1112223", password="Family-Pass-2027", confirm="Family-Pass-2027").items(): parent.fill(f"input[name={k}]", v)
        parent.check("input[name=consent]"); parent.click(SUBMIT); parent.wait_for_url("**/parent?welcome=1")
        kids = []
        for first in ["Zara", "Omar"]:
            parent.goto(BASE + "/parent/children/new")
            for k, v in dict(firstName=first, lastName="Saleem", dateOfBirth="2016-04-0" + ("3" if first == "Zara" else "9"), schoolName="City School").items(): parent.fill(f"input[name={k}]", v)
            parent.select_option("select[name=grade]", "5"); parent.click(SUBMIT); parent.wait_for_url("**added=1")
            code = re.search(r"EEA-S-\d+", parent.content()).group(0)
            pw = f"{first.lower()}-exam-2027"; parent.fill("input[name=password]", pw); parent.fill("input[name=confirm]", pw); parent.click(SUBMIT); expect(parent.locator(f"text=sign in with student ID {code}")).to_be_visible()
            kids.append((first, code, pw))
        parent.goto(BASE + "/parent/register"); parent.locator("label:has-text('Zara')").click(); parent.locator("label:has-text('Omar')").click()
        parent.get_by_role("button", name=re.compile("Register")).click(); parent.wait_for_url("**/parent/registrations/**"); expect(parent.locator("text=Registration submitted")).to_be_visible()
        ref = re.search(r"REG-\d{4}-\d+", parent.content()).group(0); ok(f"parent registered Zara and Omar online ({ref})")

        # Schedule the session now, before payment: unpaid students must not see it
        start = datetime.now(PKT) - timedelta(minutes=1); end = start + timedelta(hours=3)
        admin.goto(BASE + "/admin/exams/sessions/new"); admin.select_option("select[name=paperId]", paper)
        admin.fill("input[name=title]", "Main exam — test window"); admin.fill("input[name=opensAt]", end.strftime("%Y-%m-%dT%H:%M")); admin.fill("input[name=closesAt]", start.strftime("%Y-%m-%dT%H:%M"))
        admin.click(SUBMIT); expect(admin.locator("text=Closing time must be after opening time")).to_be_visible()
        admin.fill("input[name=opensAt]", start.strftime("%Y-%m-%dT%H:%M")); admin.fill("input[name=closesAt]", end.strftime("%Y-%m-%dT%H:%M")); admin.click(SUBMIT)
        admin.wait_for_url("**/sessions/**created=1"); session_url = admin.url.split("?")[0]; ok("online session scheduled (window checked)")

        zara = new(); login(zara, kids[0][1], kids[0][2]); zara.wait_for_url(BASE + "/student")
        expect(zara.locator("text=Main exam — test window")).to_have_count(0); ok("unpaid registration: exam not shown to the student")

        admin.goto(BASE + "/admin/registrations"); admin.get_by_role("link", name=ref).click()
        admin.fill("input[name=reference]", "HBL-778812"); admin.fill("input[name=amountPkr]", "1500"); admin.fill("input[name=receivedOn]", datetime.now(PKT).strftime("%Y-%m-%d")); admin.click(SUBMIT)
        expect(admin.locator("text=The amount due is PKR 3,000")).to_be_visible(); ok("payment amount must match the amount due")
        admin.fill("input[name=amountPkr]", "3000"); admin.click(SUBMIT); expect(admin.locator("text=Payment recorded. The registration is confirmed.")).to_be_visible(); ok("finance recorded a bank transfer; registration confirmed")

        # 5. Zara sits the exam
        zara.reload(); expect(zara.locator("text=Main exam — test window")).to_be_visible(); ok("paid student sees the open exam")
        zara.screenshot(path=SHOTS + "p5_student_exams.png", full_page=True)
        zara.get_by_role("button", name="Start exam").click(); zara.wait_for_url("**/student/exam/**"); zara_attempt = zara.url.split("/")[-1]
        expect(zara.get_by_role("timer")).to_contain_text(re.compile(r"^4[45]:\d\d$")); ok("exam opens with a 45-minute server timer")

        answers = {re.sub(r"\s+", " ", q["stem"]): q for q in QS}
        answers["What is 9 × 9?"] = dict(type="Single choice", ans_text="81")
        wrong_once = {"done": False}
        def answer_current(page, deliberately_wrong=False):
            stem = page.locator("section p[dir=auto]").first.inner_text().strip()
            q = answers[stem]
            if q["type"] in ("Number", "Short answer"):
                page.locator("section input[autocomplete=off]").fill(q["ans_text"])
            elif q["type"] == "Multiple choice":
                for t in q["ans_text"]: page.locator(f"section label:has(span:text-is('{t}'))").click()
            else:
                if deliberately_wrong:
                    labels = page.locator("section fieldset label")
                    for j in range(labels.count()):
                        if labels.nth(j).locator("span[dir=auto]").inner_text().strip() != q["ans_text"]:
                            labels.nth(j).click(); break
                else:
                    page.locator(f"section label:has(span:text-is('{q['ans_text']}'))").click()
            return q

        def stem_type(page):
            return answers[page.locator("section p[dir=auto]").first.inner_text().strip()]["type"]
        for i in range(5):
            make_wrong = not wrong_once["done"] and stem_type(zara) == "Single choice"
            answer_current(zara, deliberately_wrong=make_wrong)
            if make_wrong: wrong_once["done"] = True
            if i == 1: zara.get_by_role("button", name="Mark for review").click()
            zara.get_by_role("button", name="Next").click()
        expect(zara.locator("text=All answers saved")).to_be_visible(timeout=8000)
        zara.reload(); expect(zara.locator("text=5 of 10 answered")).to_be_visible(); expect(zara.get_by_role("button", name=re.compile("marked for review"))).to_have_count(1)
        ok("after a reload, saved answers and review marks come back")
        zara.get_by_role("button", name=re.compile(r"^Question 6")).click()
        for i in range(5, 10):
            make_wrong = not wrong_once["done"] and stem_type(zara) == "Single choice"
            answer_current(zara, deliberately_wrong=make_wrong)
            if make_wrong: wrong_once["done"] = True
            if i < 9: zara.get_by_role("button", name="Next").click()
        expect(zara.locator("text=All answers saved")).to_be_visible(timeout=8000)
        zara.screenshot(path=SHOTS + "p5_exam_screen.png", full_page=True)

        # Isolation while she is writing
        omar = new(); login(omar, kids[1][1], kids[1][2]); omar.wait_for_url(BASE + "/student")
        omar.goto(BASE + f"/student/exam/{zara_attempt}"); expect(omar.locator("text=could not be found").or_(omar.locator("text=not found")).first).to_be_visible(); ok("another student cannot open Zara's exam")
        omar.goto(BASE + "/admin/questions"); omar.wait_for_url(BASE + "/student"); ok("student cannot reach the question bank")
        admin.goto(session_url); expect(admin.locator("text=Writing").first).to_be_visible(); expect(admin.locator("tbody tr").first).to_contain_text("10 / 10"); ok("staff monitor shows Zara writing, 10 of 10 answered")

        zara.get_by_role("button", name="Finish", exact=True).click(); expect(zara.locator("text=Ready to submit?")).to_be_visible(); expect(zara.locator("text=1 marked for review")).to_be_visible()
        zara.get_by_role("button", name="Submit my answers").click(); expect(zara.locator("text=Your answers have been submitted")).to_be_visible(timeout=10000)
        score = sql(f"select score || ' ' || max_score || ' ' || correct_count from exam_attempts where id='{zara_attempt}'")
        assert wrong_once["done"] and score == "8.75 10 9", score; ok(f"auto-marked with 25% negative marking: {score.split()[0]} of 10")
        zara.goto(BASE + "/student"); expect(zara.locator("text=Submitted").first).to_be_visible(); ok("student home shows the exam as submitted (no score before results are published)")
        assert "8.75" not in zara.content() and "10.00" not in zara.content()

        # 6. Omar: the clock runs out
        omar.goto(BASE + "/student"); omar.get_by_role("button", name="Start exam").click(); omar.wait_for_url("**/student/exam/**"); omar_attempt = omar.url.split("/")[-1]
        answer_current(omar); expect(omar.locator("text=All answers saved")).to_be_visible(timeout=8000)
        sql(f"update exam_attempts set deadline_at = now() + interval '6 seconds' where id='{omar_attempt}'")
        omar.reload(); expect(omar.locator("text=Your answers have been submitted")).to_be_visible(timeout=20000); expect(omar.locator("text=Time ran out")).to_be_visible()
        assert sql(f"select status || ' ' || submitted_reason from exam_attempts where id='{omar_attempt}'") == "submitted time"; ok("timer reached zero: answers submitted automatically")
        omar.goto(BASE + "/student"); expect(omar.get_by_role("button", name=re.compile("Start exam|Continue"))).to_have_count(0); ok("a submitted exam cannot be restarted")

        admin.goto(session_url); expect(admin.locator("text=Time ran out")).to_be_visible(); admin.screenshot(path=SHOTS + "p5_session_monitor.png", full_page=True)
        admin.goto(BASE + f"/admin/exams/papers/{paper}"); expect(admin.get_by_role("button", name="Reopen as draft")).to_have_count(0); ok("a paper with sessions stays final")
        b.close()

    except Exception:
        for i, pg in enumerate(PAGES):
            try: pg.screenshot(path=f"/tmp/fail_{i}.png", full_page=True)
            except Exception: pass
        raise
print(f"\n{len(passed)} checks passed")
