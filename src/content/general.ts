/**
 * General site content. Real items are added from the admin CMS in Phase 7.
 * Empty lists hide their homepage sections: no invented testimonials,
 * achievements or statistics are ever shown.
 */

export type NewsItem = { slug: string; title: string; date: string; excerpt: string; body: string[] };
export type Testimonial = { quote: string; name: string; role: string };
export type Achievement = { name: string; school: string; result: string };

export const news: NewsItem[] = [];
export const testimonials: Testimonial[] = [];
export const achievements: Achievement[] = [];

export const generalFaqs = [
  {
    q: "Who can take part?",
    a: "Students from any school and education board can take part, in the grades listed on each competition page. Students can register through their school or individually.",
  },
  {
    q: "Are exams online or on paper?",
    a: "Both. Many competitions can be taken online on a laptop, desktop or tablet, or on paper at the student's own school. Each competition page lists the modes available.",
  },
  {
    q: "How does a school register many students at once?",
    a: "Schools get their own dashboard where the coordinator can upload a class list from Excel, check it for mistakes, choose competitions and pay in one go.",
  },
  {
    q: "How are results and ranks decided?",
    a: "Answers are marked automatically against the answer key. Ranks are calculated per grade, and ties are broken by published rules such as accuracy and time taken. Results are checked and approved before they are published.",
  },
  {
    q: "How can someone check that a certificate is genuine?",
    a: "Every EEA certificate has a unique number and a QR code. Scanning the code, or entering the number on our verification page, shows whether it is valid.",
  },
  {
    q: "How is my child's information protected?",
    a: "We collect only what is needed to run the competition, keep it private to the student, their parents and their school, and never sell it or use it for advertising.",
  },
];
