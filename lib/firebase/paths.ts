/** Family paths must be constructed from a SERVER-authorized context. */
import {
  documentIdSchema,
  type FamilyContext,
  type ParentContext,
} from "./domain";
import { AuthorizationError, requireParent } from "./authorization";

const id = (value: string) => documentIdSchema.parse(value);
export function familyPath(context: FamilyContext): string {
  if (context.kind !== "parent" && context.kind !== "learner")
    throw new AuthorizationError();
  return `families/${id(context.familyId)}`;
}
export function learnerPath(context: FamilyContext, learnerId: string): string {
  if (context.kind === "learner" && context.learnerId !== learnerId)
    throw new AuthorizationError();
  return `${familyPath(context)}/learners/${id(learnerId)}`;
}
export function sessionPath(
  context: FamilyContext,
  learnerId: string,
  sessionId: string,
): string {
  return `${learnerPath(context, learnerId)}/sessions/${id(sessionId)}`;
}
export function attemptPath(
  context: FamilyContext,
  learnerId: string,
  attemptId: string,
): string {
  return `${learnerPath(context, learnerId)}/attempts/${id(attemptId)}`;
}
export function writingRevisionPath(
  context: FamilyContext,
  learnerId: string,
  draftId: string,
  revisionId: string,
): string {
  return `${learnerPath(context, learnerId)}/drafts/${id(draftId)}/revisions/${id(revisionId)}`;
}
export function curriculumOverridePath(
  context: ParentContext,
  outcomeId: string,
): string {
  requireParent(context);
  return `${familyPath(context)}/curriculumOverrides/${id(outcomeId)}`;
}
export function curriculumReviewPath(
  context: ParentContext,
  conflictId: string,
): string {
  requireParent(context);
  return `${familyPath(context)}/curriculumReviews/${id(conflictId)}`;
}
