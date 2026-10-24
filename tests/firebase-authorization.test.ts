import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authorizeParent,
  authorizeChild,
  authorizePlatformAdmin,
  requireLearner,
  requireOwner,
  requireRecentAuthentication,
  AuthorizationError,
} from "../lib/firebase/authorization";
import {
  learnerInputSchema,
  writingInputSchema,
  answerInputSchema,
  type Family,
  type Membership,
  type ParentGrant,
  type ChildGrant,
  type Learner,
  type VerifiedParentIdentity,
  type FamilyContext,
} from "../lib/firebase/domain";
import {
  learnerPath,
  writingRevisionPath,
  curriculumOverridePath,
} from "../lib/firebase/paths";
const now = 1_800_000_000_000;
const identity: VerifiedParentIdentity = {
  uid: "parent-a",
  email: "parent@example.invalid",
  emailVerified: true,
  authTimeMs: now - 60000,
  tokenExpiresAtMs: now + 3600000,
};
const family: Family = {
  id: "family-a",
  ownerUid: "parent-a",
  status: "active",
  schemaVersion: 1,
};
const membership: Membership = {
  familyId: family.id,
  uid: identity.uid,
  role: "owner",
  status: "active",
};
const grant: ParentGrant = {
  kind: "parent",
  uid: identity.uid,
  familyId: family.id,
  expiresAtMs: now + 3600000,
  revokedAtMs: null,
};
const learner: Learner = {
  id: "learner-a",
  familyId: family.id,
  nickname: "Test learner",
  grade: 2,
  status: "active",
  accessVersion: 1,
};
const childGrant: ChildGrant = {
  kind: "learner",
  familyId: family.id,
  learnerId: learner.id,
  accessVersion: 1,
  expiresAtMs: now + 600000,
  revokedAtMs: null,
};
const parent = () => authorizeParent(identity, family, membership, grant, now);
const child = () => authorizeChild(childGrant, family, learner, now);
test("foundation authorization accepts the verified owning parent", () => {
  assert.equal(parent().familyId, family.id);
  requireLearner(parent(), learner);
  assert.equal(requireOwner(parent()).uid, identity.uid);
});
test("foundation authorization rejects unrelated family and forged membership identities", () => {
  for (const member of [
    { ...membership, familyId: "family-b" },
    { ...membership, uid: "parent-b" },
    { ...membership, status: "revoked" as const },
  ])
    assert.throws(
      () => authorizeParent(identity, family, member, grant, now),
      AuthorizationError,
    );
  assert.throws(
    () =>
      authorizeParent(
        identity,
        family,
        membership,
        { ...grant, familyId: "family-b" },
        now,
      ),
    AuthorizationError,
  );
  assert.throws(
    () =>
      authorizeParent(
        identity,
        { ...family, ownerUid: "parent-b" },
        membership,
        grant,
        now,
      ),
    AuthorizationError,
  );
});
test("foundation refuses unverified, expired and revoked parent access", () => {
  for (const who of [
    { ...identity, emailVerified: false },
    { ...identity, tokenExpiresAtMs: now },
    { ...identity, email: "" },
  ])
    assert.throws(
      () => authorizeParent(who, family, membership, grant, now),
      AuthorizationError,
    );
  for (const g of [
    { ...grant, expiresAtMs: now },
    { ...grant, revokedAtMs: now - 1 },
    { ...grant, expiresAtMs: Infinity },
    { ...grant, familyId: null },
  ])
    assert.throws(
      () => authorizeParent(identity, family, membership, g, now),
      AuthorizationError,
    );
});
test("foundation denies suspended and deleting families", () => {
  for (const status of ["suspended", "deleting", "deleted"] as const) {
    const f = { ...family, status };
    assert.throws(
      () => authorizeParent(identity, f, membership, grant, now),
      AuthorizationError,
    );
    assert.throws(
      () => authorizeChild(childGrant, f, learner, now),
      AuthorizationError,
    );
  }
});
test("future additional parent role cannot acquire owner-only privileges", () => {
  const member = { ...membership, role: "parent" as const };
  const context = authorizeParent(identity, family, member, grant, now);
  requireLearner(context, learner);
  assert.throws(() => requireOwner(context), AuthorizationError);
});
test("foundation child access is confined to its own family and learner", () => {
  requireLearner(child(), learner);
  assert.throws(
    () => requireLearner(child(), { ...learner, id: "sibling" }),
    AuthorizationError,
  );
  assert.throws(
    () => requireLearner(parent(), { ...learner, familyId: "family-b" }),
    AuthorizationError,
  );
  assert.throws(
    () =>
      authorizeChild(
        { ...childGrant, familyId: "family-b" },
        family,
        learner,
        now,
      ),
    AuthorizationError,
  );
  assert.throws(
    () =>
      authorizeChild(
        { ...childGrant, learnerId: "sibling" },
        family,
        learner,
        now,
      ),
    AuthorizationError,
  );
});
test("foundation rejects expired, revoked and outdated child grants without relying on TTL cleanup", () => {
  for (const g of [
    { ...childGrant, expiresAtMs: now },
    { ...childGrant, revokedAtMs: now - 1 },
    { ...childGrant, accessVersion: 0 },
  ])
    assert.throws(
      () => authorizeChild(g, family, learner, now),
      AuthorizationError,
    );
  assert.throws(
    () =>
      authorizeChild(
        childGrant,
        family,
        { ...learner, status: "archived" },
        now,
      ),
    AuthorizationError,
  );
  assert.throws(() => requireOwner(child()), AuthorizationError);
});
test("platform invitation administrator has no automatic child-data privilege", () => {
  const admin = authorizePlatformAdmin(identity, grant, [identity.uid], now);
  assert.equal(admin.kind, "platform-admin");
  assert.throws(
    () => requireLearner(admin as unknown as FamilyContext, learner),
    AuthorizationError,
  );
  assert.throws(
    () => authorizePlatformAdmin(identity, grant, ["another-admin"], now),
    AuthorizationError,
  );
  assert.throws(
    () =>
      authorizePlatformAdmin(
        identity,
        { ...grant, revokedAtMs: now - 1 },
        [identity.uid],
        now,
      ),
    AuthorizationError,
  );
  assert.throws(
    () =>
      requireRecentAuthentication(
        { ...identity, authTimeMs: now - 6 * 60000 },
        now,
      ),
    AuthorizationError,
  );
});
test("family document paths separate identical learner IDs and block traversal", () => {
  const a = parent(),
    b = { ...a, familyId: "family-b" };
  assert.notEqual(learnerPath(a, "same-id"), learnerPath(b, "same-id"));
  assert.equal(
    writingRevisionPath(a, "same-id", "draft", "revision"),
    "families/family-a/learners/same-id/drafts/draft/revisions/revision",
  );
  for (const id of ["../family-b", "a/b", "%2f", "..", "a\\b"])
    assert.throws(() => learnerPath(a, id));
  assert.throws(() => learnerPath(child(), "sibling"), AuthorizationError);
  assert.equal(
    curriculumOverridePath(a, "p2-number"),
    "families/family-a/curriculumOverrides/p2-number",
  );
});
test("new profile contracts support Primary 1 through 6 and reject ownership/PII injection", () => {
  for (let grade = 1; grade <= 6; grade++)
    assert.equal(
      learnerInputSchema.parse({ nickname: "Test", grade }).grade,
      grade,
    );
  for (const grade of [0, 7, 2.5, "2"])
    assert.equal(
      learnerInputSchema.safeParse({ nickname: "Test", grade }).success,
      false,
    );
  for (const extra of [
    { familyId: "other" },
    { role: "owner" },
    { dateOfBirth: "2020-01-01" },
  ])
    assert.equal(
      learnerInputSchema.safeParse({ nickname: "Test", grade: 2, ...extra })
        .success,
      false,
    );
});
test("writing and answer contracts accept content but reject client-owned score or tenant fields", () => {
  assert.equal(
    writingInputSchema.safeParse({ text: "Original test writing." }).success,
    true,
  );
  assert.equal(
    writingInputSchema.safeParse({ text: "Test", familyId: "other" }).success,
    false,
  );
  const answer = {
    lessonId: "lesson-a",
    questionId: "p2-number:21",
    turn: 0,
    answer: "20",
  };
  assert.equal(answerInputSchema.safeParse(answer).success, true);
  for (const extra of [
    { correct: true },
    { assisted: false },
    { learnerId: "sibling" },
    { familyId: "other" },
  ])
    assert.equal(
      answerInputSchema.safeParse({ ...answer, ...extra }).success,
      false,
    );
});
