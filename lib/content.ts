import { scienceBank } from "./science";
export const modules = [
  "Mathematics",
  "English",
  "Verbal Reasoning",
  "Quantitative Reasoning",
  "General Paper",
  "Non-Verbal Reasoning",
] as const;
export type Module = (typeof modules)[number];
export type Skill = {
  id: string;
  grade: number;
  module: Module;
  domain: string;
  topic: string;
  objective: string;
  prerequisiteIds: string[];
  sourceId: string | null;
  sourcePage: number | null;
  originalSubject: string;
  status: "needs_review" | "supplementary";
  term: number | null;
  week: number | null;
  lesson: string;
  example: string;
  alternate: string;
  cue: string;
  hint: string;
};
export type Question = {
  id: string;
  skillId: string;
  prompt: string;
  answer: string;
  choices?: string[];
  passage?: string;
  diagram?: { turn: number; options: number[] };
  explanation: string;
  transfer: boolean;
};
const pages: {
  [key: number]: { math: number; english: number; science: number };
} = {
  1: { math: 617, english: 611, science: 623 },
  2: { math: 674, english: 668, science: 680 },
  3: { math: 746, english: 743, science: 749 },
  4: { math: 790, english: 787, science: 793 },
  5: { math: 848, english: 845, science: 853 },
  6: { math: 901, english: 895, science: 907 },
};
const scienceTopics = [
  "Living and non-living things",
  "Looking after our eyes",
  "Measuring length",
  "Changes of state",
  "Habitats and adaptation",
  "Our solar system",
];
const scienceLessons = [
  [
    "Living things grow and need resources. A seed can grow into a plant. A stone does not grow in this way.",
    "A bean seed needs water and suitable conditions to grow. A toy car cannot grow.",
    "Imagine caring for a plant and a toy: the plant needs water, while the toy does not.",
    "Think about growth and the needs of living things.",
  ],
  [
    "Our eyes let us detect light, colours and shapes. Read with enough light. Never look directly at the Sun or put objects in your eyes. Ask an adult if an eye hurts.",
    "Amina moves her book to a well-lit table. This makes the words easier to see.",
    "Think of a camera: it needs light to make an image. Your eyes also need light to see.",
    "Which part of your body helps you see?",
  ],
  [
    "Length tells us how long something is. Start at zero on a ruler. Centimetres measure small lengths; metres help measure longer distances.",
    "A pencil starts at 0 cm and ends at 8 cm. Its length is 8 cm.",
    "Line up equal-sized blocks beside an object. A ruler uses equal-sized units too.",
    "Check where the measurement starts.",
  ],
  [
    "Water can be solid ice, liquid water or water vapour, a gas. Warming ice melts it. Cooling liquid water enough freezes it. Observe an ice cube with an adult; do not handle hot water.",
    "An ice cube left on a plate becomes liquid water as it warms.",
    "Imagine particles: in a solid they stay in fixed positions; in a liquid they move past each other.",
    "Melting changes a solid into a liquid.",
  ],
  [
    "A habitat is a living thing’s natural home. Adaptations help organisms survive there. Different organisms have different needs.",
    "A fish has gills that take oxygen from water. A bird uses lungs to breathe air.",
    "Compare a fish and a bird: each has features suited to its environment.",
    "Connect the body feature to the environment.",
  ],
  [
    "The Sun is a star. Earth is a planet that orbits the Sun. Earth rotates, giving us day and night. The Moon orbits Earth. Never look directly at the Sun.",
    "The side of Earth facing the Sun has daylight. As Earth turns, places move into darkness.",
    "Use a ball and a torch with an adult. Rotate the ball to see a light side and a dark side.",
    "Rotation means turning; an orbit is a path around another object.",
  ],
];
const out: Skill[] = [];
for (let grade = 1; grade <= 6; grade++) {
  const base = {
    grade,
    sourceId: null,
    sourcePage: null,
    status: "supplementary" as const,
    term: null,
    week: null,
    originalSubject: "Original supplementary learning",
  };
  const put = (
    kind: string,
    v: Omit<Skill, keyof typeof base | "id" | "prerequisiteIds"> &
      Partial<
        Pick<
          Skill,
          | "sourceId"
          | "sourcePage"
          | "status"
          | "term"
          | "week"
          | "originalSubject"
        >
      >,
    prereq: string[] = [],
  ) =>
    out.push({
      ...base,
      id: `p${grade}-${kind}`,
      prerequisiteIds: prereq,
      ...v,
    });
  const unit =
    grade <= 2
      ? "tens"
      : grade === 3
        ? "hundreds"
        : grade === 4
          ? "thousands"
          : grade === 5
            ? "millions"
            : "billions";
  put(
    "number",
    {
      module: "Mathematics",
      domain: "Number and numeration",
      topic: grade === 1 ? "Counting and groups" : `Place value: ${unit}`,
      objective:
        grade === 1
          ? "Count a small collection accurately."
          : `Identify the value of a digit in the ${unit} place.`,
      sourceId: grade === 4 ? null : "970605695",
      sourcePage: grade === 4 ? null : pages[grade].math,
      originalSubject: "Mathematics",
      status: "needs_review",
      term: 1,
      week: 1,
      lesson:
        grade === 1
          ? "Count each object once. Say the next number as you point to each object. The last number tells you how many."
          : `A digit’s value depends on its position. In 48, 4 tens means 40 and 8 ones means 8. Larger numbers use the same pattern, with each place ten times the place to its right.`,
      example:
        grade === 1
          ? "Count 3 mangoes, then 1 more: 1, 2, 3, 4. There are 4 mangoes."
          : "In 352, the 5 stands for 5 tens: 50. The 3 stands for 3 hundreds: 300.",
      alternate:
        "Use a place-value chart. Each column is worth ten of the column to its right. Put each digit in its own column.",
      cue: "Point to the digit, name its column, then multiply.",
      hint: "Start by naming the place of the highlighted digit.",
    },
    grade > 1 ? [`p${grade - 1}-number`] : [],
  );
  put(
    "fraction",
    {
      module: "Mathematics",
      domain: "Fractions",
      topic: "Equal parts and equivalent fractions",
      objective: "Represent equal parts and recognise equivalent fractions.",
      lesson:
        "A fraction describes equal parts of a whole. The denominator tells how many equal parts make the whole; the numerator tells how many parts we have. Multiplying top and bottom by the same number keeps the value.",
      example:
        "A ribbon is split into 4 equal pieces. Taking 2 pieces is 2/4 of the ribbon, the same amount as 1/2.",
      alternate:
        "Draw a rectangle. Split it into 2 equal parts and shade 1. Split each part in half: now 2 of 4 parts are shaded, but the shaded area has not changed.",
      cue: "Equal parts matter. What portion of the whole is shaded?",
      hint: "Find a common factor of the top and bottom numbers.",
    },
    [`p${grade}-number`],
  );
  put("reading", {
    module: "English",
    domain: "Reading comprehension",
    topic: "Read, infer and explain",
    objective:
      grade < 4
        ? "Find information in a short original passage."
        : "Use evidence from a passage to make an inference.",
    lesson:
      "Read the passage slowly. Ask who, what and why. For a question about a detail, find the words that support your answer. For an inference, combine clues with what you know.",
    example:
      "“Tomi took an umbrella when dark clouds gathered.” The clouds suggest rain; taking the umbrella was preparation.",
    alternate:
      "Imagine the passage as a short film. Replay the moment the question asks about and look for a clue.",
    cue: "Find a clue in the passage before choosing.",
    hint: "Read the sentence about the character’s action again.",
  });
  put("verbal", {
    module: "Verbal Reasoning",
    domain: "Word relationships",
    topic: "Words with similar meanings",
    objective: "Choose a word with a similar meaning in context.",
    lesson:
      "A synonym is a word with a similar meaning. Try replacing the original word in a sentence. The new sentence should mean nearly the same thing.",
    example: "“The cheerful child smiled.” Happy can replace cheerful here.",
    alternate:
      "Make a little sentence using the word, then try each choice in that sentence.",
    cue: "Which choice keeps the same meaning?",
    hint: "Try the words in a simple sentence.",
  });
  put(
    "pattern",
    {
      module: "Quantitative Reasoning",
      domain: "Number patterns",
      topic: "Find a repeating numerical rule",
      objective: "Identify a constant step and extend a number sequence.",
      lesson:
        "Compare neighbouring numbers. Find how much is added or taken away each time. Check that your rule works for every step before finding the next number.",
      example: "4, 7, 10, 13: each number is 3 more, so the next is 16.",
      alternate:
        "Draw equal jumps along a number line. Each jump represents one step of the pattern.",
      cue: "Subtract one number from the next to find the step.",
      hint: "Work out the difference between the first two numbers.",
    },
    [`p${grade}-number`],
  );
  const sc = scienceLessons[grade - 1];
  put("science", {
    module: "General Paper",
    domain: "Basic Science",
    topic: scienceTopics[grade - 1],
    objective: `Explain a key idea about ${scienceTopics[grade - 1].toLowerCase()}.`,
    sourceId: [1, 2, 3, 5, 6].includes(grade) ? "970605695" : null,
    sourcePage: [1, 2, 3, 5, 6].includes(grade) ? pages[grade].science : null,
    status: "needs_review",
    originalSubject:
      grade < 4 ? "Basic Science" : "Basic Science and Technology",
    term: 1,
    week: 1,
    lesson: sc[0],
    example: sc[1],
    alternate: sc[2],
    cue: sc[3],
    hint: "Link the idea in the lesson to the choices.",
  });
  put("civic", {
    module: "General Paper",
    domain: "Social and Citizenship Studies",
    topic: "Caring for shared spaces",
    objective: "Choose a responsible action in a shared community space.",
    lesson:
      "Shared places belong to the community. We care for them by using bins, taking turns, respecting others and asking a trusted adult for help when needed.",
    example:
      "If a playground is littered, put safe litter in a bin with an adult. Leave sharp or unknown objects for an adult.",
    alternate:
      "Think of your classroom as a shared home. What action would help everyone?",
    cue: "Choose the action that helps people and keeps them safe.",
    hint: "Think about everyone who uses the space.",
  });
  put("shapes", {
    module: "Non-Verbal Reasoning",
    domain: "Spatial reasoning",
    topic: "Quarter-turns",
    objective: "Identify the result of a clockwise quarter-turn.",
    lesson:
      "A quarter-turn is a rotation through 90 degrees. Clockwise follows the hands of a clock: up, right, down, left, then up again.",
    example:
      "An arrow pointing up points right after one clockwise quarter-turn.",
    alternate:
      "Point your finger up. Turn it once towards the right. That movement is one clockwise quarter-turn.",
    cue: "Follow the clock: up, right, down, left.",
    hint: "Move one position clockwise, not a half-turn.",
  });
  put("writing", {
    module: "English",
    domain: "Composition",
    topic: "Write, review and revise",
    objective: "Write a clear account with a beginning, middle and ending.",
    lesson:
      "Plan who, where and what happened. Use a beginning, middle and ending. Read your draft aloud, check sentences, and improve one detail.",
    example:
      "“We planted a bean. First, we filled a pot with soil. Then we watered it. A week later a shoot appeared.”",
    alternate:
      "Tell the story aloud first. Write one sentence for each event, then join the events in order.",
    cue: "What happened first, next and last?",
    hint: "Choose one sentence and add a clear detail.",
  });
}
export const skills = out;
export const skillById = (id: string) => skills.find((s) => s.id === id);
export function question(skill: Skill, variant: number): Question {
  const g = skill.grade;
  const v = ((variant % 60) + 60) % 60;
  const kind = skill.id.split("-")[1];
  const base = {
    id: `${skill.id}:${v}`,
    skillId: skill.id,
    transfer: v % 3 === 2,
  };
  if (kind === "number") {
    if (g === 1) {
      const a = 2 + (v % 7),
        b = 1 + (Math.floor(v / 7) % 4);
      return {
        ...base,
        id: `${skill.id}:${a}-${b}`,
        prompt: `There are ${a} beans in a cup and ${b} more on a plate. How many beans are there altogether?`,
        answer: String(a + b),
        explanation: `Count ${a} then count on ${b} more: ${a + b}.`,
      };
    }
    const power = [0, 0, 1, 2, 3, 6, 9][g];
    const digit = 2 + (v % 7);
    const value = digit * 10 ** power;
    const n = value + 1 + (Math.floor(v / 7) % Math.min(10 ** power - 1, 89));
    return {
      ...base,
      id: `${skill.id}:${n}`,
      prompt: `${v % 3 === 2 ? "A library recorded " : "Look at "}${n.toLocaleString("en-NG")}${v % 3 === 2 ? " books." : "."} What is the value of the leftmost digit, ${digit}? Write its value in figures.`,
      answer: String(value),
      explanation: `The digit ${digit} is in the ${10 ** power === 10 ? "tens" : 10 ** power === 100 ? "hundreds" : 10 ** power === 1000 ? "thousands" : 10 ** power === 1000000 ? "millions" : "billions"} place, so it stands for ${value.toLocaleString("en-NG")}.`,
    };
  }
  if (kind === "fraction") {
    const d = 2 + (v % 7),
      n = 1 + (Math.floor(v / 7) % (d - 1));
    const factor = 2 + (v % 3);
    return {
      ...base,
      id: `${skill.id}:${n * factor}-${d * factor}`,
      prompt: `A strip has ${d * factor} equal parts. ${n * factor} are shaded. What fraction is shaded? Give an equivalent fraction.`,
      answer: `${n}/${d}`,
      explanation: `${n * factor}/${d * factor} and ${n}/${d} describe the same amount: divide both numbers by ${factor}.`,
    };
  }
  if (kind === "pattern") {
    const start = 2 + (v % 15),
      step = (g < 4 ? 2 : 5) + (Math.floor(v / 5) % 7);
    return {
      ...base,
      id: `${skill.id}:${start}-${step}`,
      prompt: `What comes next? ${[0, 1, 2, 3].map((i) => start + i * step).join(", ")}, ___`,
      answer: String(start + 4 * step),
      explanation: `Add ${step} at each step. ${start + 3 * step} + ${step} = ${start + 4 * step}.`,
    };
  }
  if (kind === "reading") {
    const names = ["Tomi", "Ada", "Femi", "Zainab", "Ife", "Bola"];
    const name = names[v % 6];
    const objects = [
      "beans",
      "maize",
      "tomatoes",
      "peppers",
      "okra",
      "carrots",
    ];
    const obj = objects[Math.floor(v / 6) % 6];
    return {
      ...base,
      id: `${skill.id}:${v % 36}`,
      passage: `${name} helped an aunt in a small garden. They planted ${obj} beside a path. At midday, the soil felt dry, so ${name} fetched a watering can. By evening, a small bird rested on the fence. ${name} smiled and put the empty can away.`,
      prompt:
        g < 4
          ? `What did ${name} fetch for the garden?`
          : `Why did ${name} fetch a watering can?`,
      answer: g < 4 ? "A watering can" : "The soil was dry",
      choices:
        g < 4
          ? ["A watering can", "A football", "A bicycle", "A cooking pot"]
          : [
              "The soil was dry",
              "The bird was noisy",
              "The path was missing",
              "The fence was broken",
            ],
      explanation:
        g < 4
          ? "The passage says the child fetched a watering can."
          : "The dry soil is the clue: the plants needed water.",
    };
  }
  if (kind === "verbal") {
    const bank = [
      ["calm", "peaceful", "noisy", "angry", "hurried"],
      ["tiny", "small", "huge", "wide", "heavy"],
      ["rapid", "quick", "late", "quiet", "gentle"],
      ["brave", "courageous", "afraid", "sleepy", "careless"],
      ["tidy", "neat", "dirty", "loud", "rough"],
      ["honest", "truthful", "unfair", "wealthy", "silent"],
    ];
    const b = bank[v % bank.length];
    return {
      ...base,
      id: `${skill.id}:${v % bank.length}`,
      prompt: `Which word is closest in meaning to “${b[0]}”?`,
      answer: b[1],
      choices: b.slice(1),
      explanation: `${b[0]} and ${b[1]} have similar meanings in this context.`,
    };
  }
  if (kind === "science") {
    const index = v % scienceBank[g - 1].length;
    const b = scienceBank[g - 1][index];
    return {
      ...base,
      id: `${skill.id}:${index}`,
      prompt: b[0],
      answer: b[1],
      choices: b.slice(1, 5),
      explanation: b[5],
      transfer: [2, 3, 5].includes(index),
    };
  }
  if (kind === "civic")
    return {
      ...base,
      id: `${skill.id}:0`,
      prompt:
        "You see a sharp piece of broken glass in a shared playground. What should you do?",
      answer: "Tell a trusted adult and keep others away",
      choices: [
        "Tell a trusted adult and keep others away",
        "Pick it up with bare hands",
        "Hide it in the grass",
        "Throw it towards the road",
      ],
      explanation:
        "A trusted adult can handle the sharp object safely. Keep children away from it.",
    };
  if (kind === "shapes") {
    const turn = v % 4;
    const options = [0, 1, 2, 3];
    return {
      ...base,
      id: `${skill.id}:${turn}`,
      prompt:
        "Turn this arrow one quarter-turn clockwise. Choose the arrow that shows the result.",
      answer: String((turn + 1) % 4),
      diagram: { turn, options },
      explanation:
        "A clockwise quarter-turn moves up → right → down → left → up.",
    };
  }
  return {
    ...base,
    prompt:
      "Write about a time you helped someone. Describe what happened first, next and last. Do not include real names, addresses or school details.",
    answer: "",
    explanation: "Review your beginning, middle and ending.",
  };
}
