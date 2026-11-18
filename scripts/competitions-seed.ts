/**
 * EEA's competitions. Names come from EEA; grades, fees and dates are set
 * by staff in /admin/competitions (registration stays closed until they are).
 * Inserted once; later edits in the admin are never overwritten.
 */
import type { CompetitionContent } from "../src/db/schema";

type Seed = {
  slug: string; name: string; code: string; accent: string; icon: string; summary: string; sortOrder: number; content: CompetitionContent;
};

export const COMPETITIONS: Seed[] = [
  {
    slug: "mental-math-olympiad", name: "Mental Math Olympiad", code: "MMO", accent: "blue", icon: "sigma", sortOrder: 1,
    summary: "Fast, accurate calculation and number sense, without a calculator.",
    content: {
      overview: "The Mental Math Olympiad challenges students to calculate quickly and accurately in their heads. It rewards number sense, smart strategies and concentration.",
      objectives: ["Build speed and accuracy with numbers", "Strengthen number sense and estimation", "Develop focus and confidence"],
    },
  },
  {
    slug: "english-olympiad", name: "English Olympiad", code: "ENO", accent: "gold", icon: "book", sortOrder: 2,
    summary: "Grammar, vocabulary and reading comprehension.",
    content: {
      overview: "The English Olympiad measures how confidently students read, understand and use English, with questions suited to each grade.",
      objectives: ["Strengthen reading and comprehension", "Build vocabulary and correct usage", "Encourage a love of reading"],
    },
  },
  {
    slug: "science-olympiad", name: "Science Olympiad", code: "SCO", accent: "magenta", icon: "flask", sortOrder: 3,
    summary: "Scientific thinking, observation and everyday science.",
    content: {
      overview: "The Science Olympiad tests how well students understand and apply scientific ideas, often through diagrams, experiments and real-life situations.",
      objectives: ["Develop scientific thinking and observation", "Connect classroom science to everyday life", "Recognise students with a strong aptitude for science"],
    },
  },
  {
    slug: "brain-olympiad", name: "Brain Olympiad", code: "BRO", accent: "navy", icon: "brain", sortOrder: 4,
    summary: "Logical reasoning, patterns and puzzles that stretch the mind.",
    content: {
      overview: "The Brain Olympiad tests reasoning rather than memory: patterns, sequences, puzzles and problem solving that any curious student can enjoy.",
      objectives: ["Sharpen logical and analytical thinking", "Build problem-solving confidence", "Reward curiosity beyond the syllabus"],
    },
  },
];
