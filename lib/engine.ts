import { skills, type Skill, type Module } from "./content";
export type Evidence = {
  questionId: string;
  sessionId: string;
  correct: boolean;
  assisted: boolean;
  createdAt: number;
  transfer: boolean;
  repeated?: boolean;
};
export function equivalent(input: string, key: string): boolean {
  const clean = (s: string) =>
    s.trim().toLowerCase().replace(/,/g, "").replace(/\s+/g, " ");
  const num = (s: string): [number, number] | null => {
    const t = clean(s);
    if (/^[+-]?\d+(?:\.\d+)?$/.test(t)) return [Number(t), 1];
    const m = t.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    return m && Number(m[2]) !== 0 ? [Number(m[1]), Number(m[2])] : null;
  };
  const a = num(input),
    b = num(key);
  if (a && b)
    return (
      Number.isFinite(a[0] / a[1]) && Math.abs(a[0] * b[1] - b[0] * a[1]) < 1e-8
    );
  return clean(input) === clean(key);
}
export function mastery(events: Evidence[]) {
  const independent = events.filter(
    (e) => e.correct && !e.assisted && !e.repeated,
  );
  const distinct = new Set(independent.map((e) => e.questionId));
  const sessions = new Set(independent.map((e) => e.sessionId));
  const first = Math.min(...independent.map((e) => e.createdAt));
  const spaced = independent.some((e) => e.createdAt >= first + 86400000);
  const transfer = independent.some((e) => e.transfer);
  return {
    attempts: events.length,
    independent: independent.length,
    repeated: events.filter((e) => e.correct && e.repeated && !e.assisted)
      .length,
    assisted: events.filter((e) => e.correct && e.assisted).length,
    distinct: distinct.size,
    sessions: sessions.size,
    state:
      distinct.size >= 3 && sessions.size >= 2 && spaced && transfer
        ? "retained"
        : distinct.size >= 3 && sessions.size >= 2 && transfer
          ? "provisional"
          : events.length
            ? "learning"
            : "untouched",
  };
}
export function eligible(grade: number, stretch: boolean) {
  return skills.filter(
    (s) =>
      s.grade === grade ||
      s.grade === grade - 1 ||
      (stretch && s.grade === grade + 1),
  );
}
export function chooseSkill(
  grade: number,
  module: Module,
  stretch: boolean,
  stats: Record<string, { state: string; due?: number }>,
  now = Date.now(),
): Skill {
  const all = eligible(grade, stretch).filter(
    (s) => s.module === module && s.domain !== "Composition",
  );
  const core = all.filter((s) => s.grade === grade);
  const due = core.find((s) => stats[s.id]?.due && stats[s.id].due! <= now);
  if (due) return due;
  const next = core.find((s) => stats[s.id]?.state !== "retained") || core[0];
  const missing = next.prerequisiteIds
    .map((id) => all.find((s) => s.id === id))
    .find((s) => s && stats[s.id]?.state === "learning");
  if (missing) return missing;
  if (stretch && core.every((s) => stats[s.id]?.state === "retained"))
    return all.find((s) => s.grade === grade + 1) || next;
  return next;
}
export function weeklyPlan(grade: number) {
  return [
    "Mathematics",
    "English",
    "General Paper",
    "Quantitative Reasoning",
    "English",
    ...(grade < 4
      ? ["Non-Verbal Reasoning", "Verbal Reasoning"]
      : ["Verbal Reasoning", "Non-Verbal Reasoning"]),
  ];
}
export function writingFeedback(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = (text.match(/[.!?](?:\s|$)/g) || []).length;
  return {
    label: "Local checklist feedback — parent review needed",
    words,
    items: [
      {
        area: "Relevance",
        note: "Check that each sentence relates to helping someone; a parent can discuss meaning with you.",
      },
      {
        area: "Organisation",
        note: /\b(first|next|then|finally|last)\b/i.test(text)
          ? "You used a sequence word. Check that the order is clear."
          : "Try “first”, “next” or “finally” to connect your ideas.",
      },
      {
        area: "Vocabulary",
        note: "Choose one general word and try a more precise one.",
      },
      {
        area: "Grammar",
        note: "Read each sentence aloud. Check that it makes sense; a parent should review grammar.",
      },
      {
        area: "Punctuation",
        note: sentences
          ? "You used sentence-ending punctuation. Check capitals too."
          : "Add a full stop, question mark or exclamation mark at the end of a sentence.",
      },
    ],
    sentences,
  };
}
