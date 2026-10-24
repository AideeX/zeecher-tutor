/** Async ports for Phase 2. No adapter is implemented or selected in Phase 1.
 * Implementations must re-check ownership on loaded records and use transactions
 * for atomic services. A typed context is not proof that a caller is authenticated.
 */
import type { Evidence } from "../engine";
import type { Question, Module, Skill } from "../content";
import type {
  Family,
  FamilyContext,
  ParentContext,
  ChildContext,
  PlatformAdminContext,
  VerifiedParentIdentity,
  FamilyInvitation,
  Learner,
  LearnerInput,
  WritingInput,
  AnswerInput,
  ParentGrant,
  ChildGrant,
} from "./domain";

export type Page<T> = Readonly<{
  items: readonly T[];
  nextCursor: string | null;
}>;
export type Session = Readonly<{
  id: string;
  familyId: string;
  learnerId: string;
  skillId: string;
  mode: string;
  startedAtMs: number;
  endedAtMs: number | null;
  status: "active" | "ended";
  turn: number;
  assisted: boolean;
  plan: readonly string[];
}>;
export type Attempt = Readonly<
  Evidence & {
    id: string;
    familyId: string;
    learnerId: string;
    skillId: string;
    response: string;
    evaluator: "deterministic";
    elapsedMs: number;
  }
>;
export type WritingRevision = Readonly<{
  id: string;
  familyId: string;
  learnerId: string;
  draftId: string;
  text: string;
  feedback: unknown;
  createdAtMs: number;
}>;
export type CurriculumOverride = Readonly<{
  outcomeId: string;
  term: number | null;
  week: number | null;
  note: string;
  updatedByUid: string;
  updatedAtMs: number;
}>;
export type LessonView = Readonly<{
  lessonId: string;
  skill: Pick<
    Skill,
    | "id"
    | "grade"
    | "module"
    | "domain"
    | "topic"
    | "objective"
    | "lesson"
    | "example"
  >;
  question: Omit<Question, "answer" | "explanation">;
  turn: number;
  phase: "guided" | "independent";
  startedAt: number;
  assisted: boolean;
  mode: string;
  totalQuestions: number | null;
}>;
/** Server orchestration port: evaluating answers and updating evidence must be
 * atomic/idempotent; never accept correctness, assistance or mastery from JSON.
 */
export interface LearningService {
  start(
    context: ChildContext,
    input: {
      module: Module;
      mode:
        | "Learn"
        | "Practise"
        | "Challenge"
        | "Revise"
        | "Entrance Practice"
        | "Diagnostic";
      skillId?: string;
    },
  ): Promise<LessonView>;
  help(
    context: ChildContext,
    input: {
      lessonId: string;
      kind: "not-taught" | "forgotten" | "hint" | "another";
    },
  ): Promise<{
    content: string;
    assisted: true;
    prerequisites: Pick<Skill, "id" | "topic" | "lesson" | "example">[];
  }>;
  answer(
    context: ChildContext,
    input: AnswerInput,
  ): Promise<{
    correct: boolean;
    assisted: boolean;
    repeated: boolean;
    message: string;
    explanation: string;
    mastery: {
      attempts: number;
      independent: number;
      assisted: number;
      repeated: number;
      distinct: number;
      sessions: number;
      state: string;
    };
    summary?: string;
    next: LessonView | null;
  }>;
  finish(context: ChildContext, lessonId: string): Promise<{ summary: string }>;
}

export interface ParentIdentityProvider {
  /** Must verify signature, issuer, audience, expiry and revocation. */
  verifySessionCookie(cookie: string): Promise<VerifiedParentIdentity>;
  verifyIdToken(idToken: string): Promise<VerifiedParentIdentity>;
  createSessionCookie(idToken: string, expiresInMs: number): Promise<string>;
  revokeUserSessions(uid: string): Promise<void>;
}
export interface SessionGrantStore {
  findParentGrant(tokenHash: string): Promise<ParentGrant | null>;
  findChildGrant(tokenHash: string): Promise<ChildGrant | null>;
  revoke(tokenHash: string): Promise<void>;
  /** Future adapter must atomically revoke this device's parent grant and issue child access. */
  launchChild(
    context: ParentContext,
    learnerId: string,
    parentTokenHash: string,
  ): Promise<{ opaqueChildToken: string; expiresAtMs: number }>;
}
export interface InvitationRepository {
  create(
    context: PlatformAdminContext,
    normalizedAdultEmail: string,
  ): Promise<{ invitation: FamilyInvitation; oneTimeToken: string }>;
  revoke(context: PlatformAdminContext, invitationId: string): Promise<void>;
  /** One-use, email-bound, expiry-checked provisioning; retry cannot create another family. */
  acceptAndProvision(
    identity: VerifiedParentIdentity,
    invitationToken: string,
  ): Promise<Family>;
}
export interface LearnerRepository {
  list(context: ParentContext, cursor?: string): Promise<Page<Learner>>;
  get(context: FamilyContext, learnerId: string): Promise<Learner | null>;
  create(context: ParentContext, input: LearnerInput): Promise<Learner>;
  update(
    context: ParentContext,
    learnerId: string,
    input: LearnerInput,
  ): Promise<Learner>;
}
export interface LearningRepository {
  activeSession(
    context: FamilyContext,
    learnerId: string,
  ): Promise<Session | null>;
  evidence(
    context: FamilyContext,
    learnerId: string,
    skillId: string,
  ): Promise<readonly Evidence[]>;
  attempts(
    context: FamilyContext,
    learnerId: string,
    cursor?: string,
  ): Promise<Page<Attempt>>;
}
export interface WritingRepository {
  revisions(
    context: FamilyContext,
    learnerId: string,
    cursor?: string,
  ): Promise<Page<WritingRevision>>;
  appendRevision(
    context: ChildContext,
    input: WritingInput,
  ): Promise<WritingRevision>;
}
export interface FamilyCurriculumRepository {
  overrides(context: ParentContext): Promise<readonly CurriculumOverride[]>;
  saveOverride(
    context: ParentContext,
    override: Omit<CurriculumOverride, "updatedByUid" | "updatedAtMs">,
  ): Promise<void>;
  reviewConflict(
    context: ParentContext,
    conflictId: string,
    status: "open" | "reviewed",
    note: string,
  ): Promise<void>;
}
export interface FamilyPrivacyService {
  /** Export only the caller's family, preserving the existing per-child export too. */
  requestExport(
    context: ParentContext,
    learnerId?: string,
  ): Promise<{ jobId: string }>;
  /** Revoke access immediately; perform recursive deletion in a durable worker. */
  requestLearnerDeletion(
    context: ParentContext,
    learnerId: string,
  ): Promise<{ jobId: string }>;
  /** Must require owner role and recent Firebase reauthentication. */
  requestFamilyDeletion(context: ParentContext): Promise<{ jobId: string }>;
}
