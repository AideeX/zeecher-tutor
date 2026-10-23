import { test } from "node:test";
import assert from "node:assert/strict";
import {
  equivalent,
  mastery,
  eligible,
  chooseSkill,
  writingFeedback,
  weeklyPlan,
  type Evidence,
} from "../lib/engine";
import { skills, question, modules } from "../lib/content";
const evidence = (v: Partial<Evidence> = {}): Evidence => ({
  questionId: "a",
  sessionId: "one",
  correct: true,
  assisted: false,
  createdAt: 1000,
  transfer: false,
  ...v,
});
test("mathematical equivalence accepts exact fractions and rejects invalid forms", () => {
  for (const a of ["1/2", "2/4", "0.5", " 10 / 20 "])
    assert.equal(equivalent(a, "1/2"), true);
  for (const a of ["1/0", "0/0", "Infinity", "1e999", "-1/2"])
    assert.equal(equivalent(a, "1/2"), false);
  assert.equal(equivalent("1,000", "1000"), true);
  assert.equal(equivalent("A watering can", "a watering can"), true);
});
test("assistance and repeated items never inflate independent mastery", () => {
  assert.equal(
    mastery(Array.from({ length: 10 }, () => evidence({ assisted: true })))
      .state,
    "learning",
  );
  const r = mastery([
    evidence(),
    evidence({ sessionId: "two", createdAt: 90000000, transfer: true }),
    evidence({ sessionId: "three" }),
  ]);
  assert.equal(r.distinct, 1);
  assert.equal(r.state, "learning");
});
test("mastery requires distinct items, sessions, transfer and spaced retrieval", () => {
  const e = [
    evidence(),
    evidence({ questionId: "b" }),
    evidence({
      questionId: "c",
      sessionId: "two",
      createdAt: 2000,
      transfer: true,
    }),
  ];
  assert.equal(mastery(e).state, "provisional");
  assert.equal(
    mastery([
      ...e,
      evidence({ questionId: "d", sessionId: "three", createdAt: 90000000 }),
    ]).state,
    "retained",
  );
  assert.equal(
    mastery(e.map((x) => ({ ...x, transfer: false }))).state,
    "learning",
  );
});
test("learner progression protects core grade and repairs prerequisites", () => {
  assert.deepEqual(
    [...new Set(eligible(2, false).map((s) => s.grade))],
    [1, 2],
  );
  assert.deepEqual(
    [...new Set(eligible(5, true).map((s) => s.grade))],
    [4, 5, 6],
  );
  assert.equal(chooseSkill(2, "Mathematics", true, {}).grade, 2);
  assert.equal(
    chooseSkill(2, "Mathematics", false, { "p1-number": { state: "learning" } })
      .id,
    "p1-number",
  );
  assert.equal(
    chooseSkill(5, "Mathematics", true, {
      "p5-number": { state: "retained" },
      "p5-fraction": { state: "retained" },
    }).grade,
    6,
  );
});
test("all grade modules have deterministic keyed items and consistent canonical IDs", () => {
  for (let g = 1; g <= 6; g++)
    for (const m of modules)
      assert.ok(skills.find((s) => s.grade === g && s.module === m));
  for (const s of skills.filter((s) => s.domain !== "Composition")) {
    const known = new Map<string, string>();
    for (let v = 0; v < 60; v++) {
      const q = question(s, v);
      assert.deepEqual(question(s, v), q);
      assert.ok(q.answer.length);
      assert.equal(equivalent(q.answer, q.answer), true);
      if (q.choices) assert.ok(q.choices.includes(q.answer));
      if (q.diagram) assert.equal(Number(q.answer), (q.diagram.turn + 1) % 4);
      if (known.has(q.id)) assert.equal(known.get(q.id), q.prompt);
      known.set(q.id, q.prompt);
    }
  }
});
test("weekly balance includes maths, English, science and reasoning", () => {
  for (const grade of [2, 5]) {
    const p = weeklyPlan(grade);
    assert.equal(p.length, 7);
    for (const subject of modules) assert.ok(p.includes(subject));
  }
});
test("writing feedback remains provisional and provides revision guidance", () => {
  const f = writingFeedback("First I helped carry a bag. Then we rested.");
  assert.match(f.label, /parent review/i);
  assert.equal(f.items.length, 5);
  assert.ok(
    f.items.find((i) => i.area === "Organisation")?.note.includes("sequence"),
  );
  assert.ok(!("score" in f));
});
test("repeated unassisted answers stay separate from independent success", () => {
  const p = mastery([
    evidence(),
    evidence({ repeated: true, questionId: "b", transfer: true }),
    evidence({
      repeated: true,
      questionId: "c",
      sessionId: "two",
      createdAt: 90000000,
    }),
  ]);
  assert.equal(p.independent, 1);
  assert.equal(p.repeated, 2);
  assert.equal(p.state, "learning");
});
