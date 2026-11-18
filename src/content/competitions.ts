/**
 * PREVIEW CONTENT — every competition below is SAMPLE data (`demo: true`) so the
 * design can be reviewed. Names, fees and dates are not real and must be replaced
 * with EEA's real competitions before launch. In Phase 3 this file is replaced by
 * the database, and competitions are managed from /admin without code changes.
 */

export type CompetitionKind = "olympiad" | "activity";
export type Accent = "gold" | "blue" | "magenta" | "navy";

export type Competition = {
  slug: string;
  name: string;
  code: string;
  kind: CompetitionKind;
  accent: Accent;
  icon: "sigma" | "flask" | "book" | "spell" | "palette" | "globe";
  summary: string;
  grades: { from: number; to: number; label: string };
  subjects: string[];
  modes: ("Online" | "Paper")[];
  levels: number;
  durationMinutes: number;
  feePKR: number;
  registrationCloses: string; // ISO date
  examDate: string; // ISO date
  overview: string;
  objectives: string[];
  eligibility: string[];
  format: { label: string; value: string }[];
  syllabus: { band: string; topics: string[] }[];
  rules: string[];
  awards: { title: string; detail: string }[];
  faqs: { q: string; a: string }[];
  demo: boolean;
};

const commonRules = [
  "Students may take each competition once per season, in the grade they are currently studying.",
  "Calculators, phones and notes are not allowed unless the paper says otherwise.",
  "Online exams are taken on a laptop, desktop or tablet with a stable internet connection.",
  "Paper exams are held at the student's school under the supervision of the school coordinator.",
  "Any form of unfair means leads to disqualification for that competition.",
];

const tieredAwards = [
  { title: "Position holders", detail: "Trophies for the top three students of each grade, nationally." },
  { title: "Medals", detail: "Medals for the top 10% of participants in each grade." },
  { title: "Merit certificates", detail: "For the top 25% of participants in each grade." },
  { title: "Participation e-certificate", detail: "Every participant receives a QR-verifiable digital certificate." },
  { title: "School awards", detail: "Recognition for schools with outstanding participation and results." },
];

export const competitions: Competition[] = [
  {
    slug: "mathematics-olympiad",
    name: "Mathematics Olympiad",
    code: "EMO",
    kind: "olympiad",
    accent: "blue",
    icon: "sigma",
    summary: "Number sense, problem solving and logical thinking beyond the textbook.",
    grades: { from: 1, to: 10, label: "Grades 1–10" },
    subjects: ["Mathematics", "Logical reasoning"],
    modes: ["Online", "Paper"],
    levels: 2,
    durationMinutes: 60,
    feePKR: 1500,
    registrationCloses: "2027-01-31",
    examDate: "2027-02-20",
    overview:
      "The Mathematics Olympiad challenges students to apply what they learn in class to unfamiliar problems. Questions reward understanding and reasoning rather than memorised methods, and each paper is set for the student's own grade.",
    objectives: [
      "Build confidence with numbers and problem solving",
      "Encourage logical, step-by-step thinking",
      "Identify and reward mathematical talent early",
      "Give schools a benchmark against students nationwide",
    ],
    eligibility: [
      "Students of Grades 1 to 10 from any school or board",
      "Registration through a participating school or individually",
    ],
    format: [
      { label: "Questions", value: "35 (Grades 1–4) · 50 (Grades 5–10)" },
      { label: "Type", value: "Multiple choice" },
      { label: "Sections", value: "Core mathematics, logical reasoning, achievers section" },
      { label: "Marking", value: "No negative marking at Level 1" },
      { label: "Level 2", value: "Top performers of each grade qualify" },
    ],
    syllabus: [
      { band: "Grades 1–2", topics: ["Numbers and counting", "Addition and subtraction", "Shapes and patterns", "Measurement, time and money"] },
      { band: "Grades 3–5", topics: ["Place value and operations", "Fractions and decimals", "Geometry and perimeter", "Data handling", "Patterns and puzzles"] },
      { band: "Grades 6–8", topics: ["Integers and rational numbers", "Algebraic expressions", "Ratio, proportion and percentages", "Geometry and mensuration", "Probability and statistics"] },
      { band: "Grades 9–10", topics: ["Sets and functions", "Linear and quadratic equations", "Coordinate geometry", "Trigonometry basics", "Logical reasoning"] },
    ],
    rules: commonRules,
    awards: tieredAwards,
    faqs: [
      { q: "Is the paper the same for every grade?", a: "No. Each grade has its own paper, matched to what students of that grade have studied." },
      { q: "Can a student sit Level 2 without Level 1?", a: "No. Level 2 is open only to students who qualify through Level 1." },
    ],
    demo: true,
  },
  {
    slug: "science-olympiad",
    name: "Science Olympiad",
    code: "ESO",
    kind: "olympiad",
    accent: "magenta",
    icon: "flask",
    summary: "Curiosity-led questions in physics, chemistry, biology and everyday science.",
    grades: { from: 1, to: 10, label: "Grades 1–10" },
    subjects: ["General science", "Physics", "Chemistry", "Biology"],
    modes: ["Online", "Paper"],
    levels: 2,
    durationMinutes: 60,
    feePKR: 1500,
    registrationCloses: "2027-01-31",
    examDate: "2027-02-27",
    overview:
      "The Science Olympiad tests how well students understand and apply scientific ideas. Many questions use diagrams, experiments and real-life situations, so careful observation matters as much as recall.",
    objectives: [
      "Develop scientific thinking and observation",
      "Connect classroom science to everyday life",
      "Recognise students with a strong aptitude for science",
    ],
    eligibility: ["Students of Grades 1 to 10 from any school or board", "Registration through a participating school or individually"],
    format: [
      { label: "Questions", value: "35 (Grades 1–4) · 50 (Grades 5–10)" },
      { label: "Type", value: "Multiple choice, diagram and image based" },
      { label: "Sections", value: "Science, reasoning, achievers section" },
      { label: "Marking", value: "No negative marking at Level 1" },
      { label: "Level 2", value: "Top performers of each grade qualify" },
    ],
    syllabus: [
      { band: "Grades 1–2", topics: ["Living and non-living things", "Plants and animals", "Our body", "Weather and seasons"] },
      { band: "Grades 3–5", topics: ["Food and health", "Matter and materials", "Force, work and energy", "Earth and space"] },
      { band: "Grades 6–8", topics: ["Cells and organisms", "Elements and compounds", "Light, sound and electricity", "Environment"] },
      { band: "Grades 9–10", topics: ["Motion and forces", "Chemical reactions", "Human biology", "Scientific method"] },
    ],
    rules: commonRules,
    awards: tieredAwards,
    faqs: [{ q: "Are diagrams included?", a: "Yes. Many questions include diagrams or images, in both online and paper exams." }],
    demo: true,
  },
  {
    slug: "english-olympiad",
    name: "English Olympiad",
    code: "EEO",
    kind: "olympiad",
    accent: "gold",
    icon: "book",
    summary: "Grammar, vocabulary, reading comprehension and spoken-English skills.",
    grades: { from: 1, to: 10, label: "Grades 1–10" },
    subjects: ["Grammar", "Vocabulary", "Reading comprehension"],
    modes: ["Online", "Paper"],
    levels: 2,
    durationMinutes: 60,
    feePKR: 1500,
    registrationCloses: "2027-02-07",
    examDate: "2027-03-06",
    overview:
      "The English Olympiad measures how confidently students read, understand and use English. Passages and questions are chosen to be engaging for each age group.",
    objectives: ["Strengthen reading and comprehension", "Build vocabulary and correct usage", "Encourage a love of reading"],
    eligibility: ["Students of Grades 1 to 10 from any school or board", "Registration through a participating school or individually"],
    format: [
      { label: "Questions", value: "35 (Grades 1–4) · 50 (Grades 5–10)" },
      { label: "Type", value: "Multiple choice and passage based" },
      { label: "Sections", value: "Grammar, vocabulary, comprehension, achievers section" },
      { label: "Marking", value: "No negative marking at Level 1" },
    ],
    syllabus: [
      { band: "Grades 1–2", topics: ["Alphabet and phonics", "Naming and action words", "Simple sentences", "Picture comprehension"] },
      { band: "Grades 3–5", topics: ["Tenses", "Parts of speech", "Synonyms and antonyms", "Short passages"] },
      { band: "Grades 6–10", topics: ["Advanced grammar", "Idioms and phrases", "Sentence correction", "Unseen passages"] },
    ],
    rules: commonRules,
    awards: tieredAwards,
    faqs: [{ q: "Is there a listening section?", a: "Online exams for younger grades may include short audio questions. Headphones are recommended." }],
    demo: true,
  },
  {
    slug: "spell-bee",
    name: "Spell Bee",
    code: "ESB",
    kind: "activity",
    accent: "magenta",
    icon: "spell",
    summary: "Spelling, pronunciation and word power, with audio questions online.",
    grades: { from: 1, to: 8, label: "Grades 1–8" },
    subjects: ["Spelling", "Vocabulary"],
    modes: ["Online"],
    levels: 2,
    durationMinutes: 45,
    feePKR: 1200,
    registrationCloses: "2027-02-14",
    examDate: "2027-03-13",
    overview:
      "The Spell Bee builds vocabulary and confidence. Students hear words spoken aloud, spell them, and choose correct usages, with a live final round for the top spellers.",
    objectives: ["Improve spelling and pronunciation", "Grow everyday vocabulary", "Build confidence in public speaking at the finals"],
    eligibility: ["Students of Grades 1 to 8", "Online exam with headphones or speakers"],
    format: [
      { label: "Questions", value: "40" },
      { label: "Type", value: "Audio and multiple choice" },
      { label: "Final", value: "Live spelling round for qualifiers" },
    ],
    syllabus: [
      { band: "Grades 1–3", topics: ["Common words", "Sight words", "Simple word families"] },
      { band: "Grades 4–8", topics: ["Commonly misspelt words", "Prefixes and suffixes", "Homophones", "Word meanings"] },
    ],
    rules: commonRules,
    awards: tieredAwards,
    faqs: [{ q: "Do I need headphones?", a: "Yes. Words are read aloud in the online exam, so headphones or speakers are needed." }],
    demo: true,
  },
  {
    slug: "young-artists",
    name: "Young Artists Competition",
    code: "EYA",
    kind: "activity",
    accent: "gold",
    icon: "palette",
    summary: "Drawing and painting on a set theme, judged by practising artists.",
    grades: { from: 1, to: 10, label: "Grades 1–10" },
    subjects: ["Drawing", "Painting"],
    modes: ["Paper"],
    levels: 1,
    durationMinutes: 90,
    feePKR: 1000,
    registrationCloses: "2027-02-14",
    examDate: "2027-03-20",
    overview:
      "Students create an artwork on a theme announced on the day, at their school. Entries are scanned, judged anonymously, and the best are exhibited online.",
    objectives: ["Encourage creativity and self-expression", "Recognise artistic talent", "Showcase student art nationally"],
    eligibility: ["Students of Grades 1 to 10", "Held at participating schools on paper"],
    format: [
      { label: "Time", value: "90 minutes" },
      { label: "Materials", value: "Drawing sheet provided; students bring colours" },
      { label: "Judging", value: "Creativity, theme, technique and presentation" },
    ],
    syllabus: [{ band: "All grades", topics: ["Theme announced on the competition day", "Any colour medium allowed"] }],
    rules: ["Artwork must be the student's own, made during the competition time.", "Tracing and printed images are not allowed.", "The school coordinator submits all artworks by the deadline."],
    awards: [
      { title: "Category winners", detail: "Trophies for the top three artworks in each grade group." },
      { title: "Online exhibition", detail: "Selected artworks are featured on the EEA website." },
      { title: "Participation e-certificate", detail: "Every participant receives a QR-verifiable digital certificate." },
    ],
    faqs: [{ q: "How are entries judged?", a: "Artworks are judged without names, against published criteria, by a panel of artists and art teachers." }],
    demo: true,
  },
  {
    slug: "general-knowledge-quiz",
    name: "General Knowledge Quiz",
    code: "EGK",
    kind: "activity",
    accent: "blue",
    icon: "globe",
    summary: "Pakistan, the world, science, sport and current affairs in one fast-paced quiz.",
    grades: { from: 3, to: 10, label: "Grades 3–10" },
    subjects: ["General knowledge", "Current affairs"],
    modes: ["Online", "Paper"],
    levels: 2,
    durationMinutes: 45,
    feePKR: 1200,
    registrationCloses: "2027-02-21",
    examDate: "2027-03-27",
    overview:
      "The General Knowledge Quiz rewards curious minds. Questions cover Pakistan's history and geography, world events, science, sport and the arts.",
    objectives: ["Encourage reading beyond the syllabus", "Build awareness of Pakistan and the world", "Make learning fun and competitive"],
    eligibility: ["Students of Grades 3 to 10"],
    format: [
      { label: "Questions", value: "50" },
      { label: "Type", value: "Multiple choice and image based" },
      { label: "Final", value: "Inter-school team quiz for top scorers" },
    ],
    syllabus: [{ band: "All grades", topics: ["Pakistan studies", "World geography", "Science and technology", "Sports", "Current affairs (last 12 months)"] }],
    rules: commonRules,
    awards: tieredAwards,
    faqs: [{ q: "Which period do current affairs cover?", a: "Events from the 12 months before the competition date." }],
    demo: true,
  },
];

export const getCompetition = (slug: string) => competitions.find((c) => c.slug === slug);
export const olympiads = competitions.filter((c) => c.kind === "olympiad");
export const activities = competitions.filter((c) => c.kind === "activity");
export const hasDemoContent = competitions.some((c) => c.demo);
