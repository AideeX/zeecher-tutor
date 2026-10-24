import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import baseline from "./fixtures/firebase-preservation.json";
import { skills, question, modules } from "../lib/content";
import { eligible, chooseSkill } from "../lib/engine";
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
test("Phase 1 preserves the pre-migration curriculum, provenance and assessment outputs", () => {
  assert.equal(skills.length, baseline.objectives);
  assert.equal(digest(skills), baseline.skillFingerprint);
  const items = skills
    .filter((s) => s.domain !== "Composition")
    .flatMap((s) => Array.from({ length: 60 }, (_, i) => question(s, i)));
  assert.equal(digest(items), baseline.assessmentFingerprint);
  assert.equal(
    new Set(items.map((q) => q.id)).size,
    baseline.distinctAssessmentIds,
  );
});
test("existing engine boundaries support all six primary grades without grade 0 or 7", () => {
  for (let grade = 1; grade <= 6; grade++) {
    assert.ok(eligible(grade, true).every((s) => s.grade >= 1 && s.grade <= 6));
    for (const moduleName of modules)
      assert.equal(chooseSkill(grade, moduleName, false, {}).grade, grade);
  }
});
