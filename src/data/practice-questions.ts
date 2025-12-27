export interface Question {
  id: string
  chapter: number
  question: string
  diagram?: string
  options: { letter: string; text: string }[]
  correctAnswer: string
  explanation: string
}

export const questions: Question[] = [
  {
    id: "ch1-q1",
    chapter: 1,
    question: "Which connective tissue sheath surrounds each individual muscle fiber?",
    options: [
      { letter: "A", text: "Epimysium" },
      { letter: "B", text: "Perimysium" },
      { letter: "C", text: "Endomysium" },
      { letter: "D", text: "Periosteum" },
    ],
    correctAnswer: "C",
    explanation:
      "The epimysium surrounds the entire muscle, the perimysium surrounds bundles of fibers (fasciculi), and the endomysium surrounds individual fibers (cells). This hierarchy is detailed on page 2.",
  },
  {
    id: "ch1-q2",
    chapter: 1,
    question:
      "To initiate a muscle contraction, Calcium (Ca²⁺) is released from the sarcoplasmic reticulum and binds to which regulatory protein?",
    options: [
      { letter: "A", text: "Tropomyosin" },
      { letter: "B", text: "Troponin" },
      { letter: "C", text: "Actin" },
      { letter: "D", text: "Myosin" },
    ],
    correctAnswer: "B",
    explanation:
      "As described in the \"Sliding Filament Theory\" section (Page 5), Calcium binds to Troponin. This binding causes a conformational change that moves Tropomyosin away from the binding sites on the Actin filament, allowing the Myosin head to attach.",
  },
  {
    id: "ch1-q3",
    chapter: 1,
    question: "Which area of the sarcomere contains only myosin filaments (no actin overlap)?",
    diagram: `THE SARCOMERE (Relaxed State)

      Z-Line                                         Z-Line
        |                                              |
        /  ----------     ==============     ---------- \\
        \\  ----------     ==============     ---------- /
        /                 ======||======                \\
        \\  ----------     ==============     ---------- /
        /  ----------     ==============     ---------- \\
        |                       ^^                     |
                           M-Line (Center)

      [..................................................]
                          One Sarcomere

           <-- I --> <------- A-Band -------> <-- I -->
                     <-- H -->`,
    options: [
      { letter: "A", text: "I-Band" },
      { letter: "B", text: "A-Band" },
      { letter: "C", text: "H-Zone" },
      { letter: "D", text: "Z-Line" },
    ],
    correctAnswer: "C",
    explanation:
      "The H-Zone is the central region of the A-Band that contains only thick (myosin) filaments with no overlap from thin (actin) filaments. The I-Band contains only actin, the A-Band spans the entire length of myosin (including overlap regions), and the Z-Line is where actin filaments anchor.",
  },
]

export function getQuestionsByChapter(chapter: number): Question[] {
  return questions.filter((q) => q.chapter === chapter)
}

export function getAllChapters(): number[] {
  return [...new Set(questions.map((q) => q.chapter))].sort((a, b) => a - b)
}
