/** Pure guards for future server adapters. They DO NOT verify Firebase tokens. */
import {
  documentIdSchema,
  parentEmailSchema,
  type VerifiedParentIdentity,
  type ParentGrant,
  type ChildGrant,
  type Membership,
  type Family,
  type Learner,
  type FamilyContext,
  type ParentContext,
  type ChildContext,
  type PlatformAdminContext,
} from "./domain";

export class AuthorizationError extends Error {
  constructor() {
    super("Access denied.");
    this.name = "AuthorizationError";
  }
}
function ensure(condition: unknown): asserts condition {
  if (!condition) throw new AuthorizationError();
}
function validId(id: string) {
  ensure(documentIdSchema.safeParse(id).success);
}
function validateIdentity(identity: VerifiedParentIdentity, now: number) {
  validId(identity.uid);
  ensure(parentEmailSchema.safeParse(identity.email).success);
  ensure(
    Number.isSafeInteger(now) && Number.isSafeInteger(identity.authTimeMs),
  );
  ensure(
    identity.emailVerified === true && identity.authTimeMs <= now + 30_000,
  );
  ensure(
    identity.authTimeMs > 0 &&
      Number.isSafeInteger(identity.tokenExpiresAtMs) &&
      identity.tokenExpiresAtMs > now,
  );
}
function liveGrant(grant: ParentGrant | ChildGrant, now: number) {
  ensure(
    Number.isSafeInteger(now) &&
      Number.isSafeInteger(grant.expiresAtMs) &&
      grant.expiresAtMs > now &&
      grant.revokedAtMs === null,
  );
}
export function authorizeParent(
  identity: VerifiedParentIdentity,
  family: Family,
  membership: Membership,
  grant: ParentGrant,
  now: number,
): ParentContext {
  validateIdentity(identity, now);
  validId(family.id);
  liveGrant(grant, now);
  ensure(family.status === "active" && membership.status === "active");
  ensure(
    grant.kind === "parent" &&
      grant.uid === identity.uid &&
      membership.uid === identity.uid,
  );
  ensure(grant.familyId === family.id && membership.familyId === family.id);
  ensure(membership.role === "owner" || membership.role === "parent");
  if (membership.role === "owner") ensure(family.ownerUid === identity.uid);
  return Object.freeze({
    kind: "parent",
    familyId: family.id,
    uid: identity.uid,
    role: membership.role,
  });
}
export function authorizeChild(
  grant: ChildGrant,
  family: Family,
  learner: Learner,
  now: number,
): ChildContext {
  validId(family.id);
  validId(learner.id);
  liveGrant(grant, now);
  ensure(
    grant.kind === "learner" &&
      family.status === "active" &&
      learner.status === "active",
  );
  ensure(
    grant.familyId === family.id &&
      learner.familyId === family.id &&
      grant.learnerId === learner.id,
  );
  ensure(
    Number.isSafeInteger(grant.accessVersion) &&
      grant.accessVersion >= 0 &&
      grant.accessVersion === learner.accessVersion,
  );
  return Object.freeze({
    kind: "learner",
    familyId: family.id,
    learnerId: learner.id,
  });
}
export function requireLearner(context: FamilyContext, learner: Learner): void {
  ensure(context.kind === "parent" || context.kind === "learner");
  ensure(context.familyId === learner.familyId && learner.status === "active");
  if (context.kind === "learner") ensure(context.learnerId === learner.id);
}
export function requireParent(context: FamilyContext): ParentContext {
  ensure(context.kind === "parent");
  return context;
}
export function requireOwner(context: FamilyContext): ParentContext {
  const parent = requireParent(context);
  ensure(parent.role === "owner");
  return parent;
}
export function requireRecentAuthentication(
  identity: VerifiedParentIdentity,
  now: number,
): void {
  validateIdentity(identity, now);
  ensure(now - identity.authTimeMs <= 5 * 60_000);
}
export function authorizePlatformAdmin(
  identity: VerifiedParentIdentity,
  grant: ParentGrant,
  administratorUids: readonly string[],
  now: number,
): PlatformAdminContext {
  requireRecentAuthentication(identity, now);
  liveGrant(grant, now);
  ensure(grant.kind === "parent" && grant.uid === identity.uid);
  ensure(administratorUids.includes(identity.uid));
  return Object.freeze({ kind: "platform-admin", uid: identity.uid });
}
