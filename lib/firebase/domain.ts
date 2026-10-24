/** Phase 1 contracts only. No Firebase SDK, connection, or runtime migration. */
import { z } from "zod";

export const documentIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
export const gradeSchema = z.number().int().min(1).max(6);
export const parentEmailSchema = z.string().trim().email();
export const learnerInputSchema = z
  .object({
    nickname: z.string().trim().min(1).max(24),
    grade: gradeSchema,
  })
  .strict();
export const writingInputSchema = z
  .object({
    draftId: documentIdSchema.optional(),
    text: z.string().min(1).max(8000),
  })
  .strict();
export const answerInputSchema = z
  .object({
    lessonId: documentIdSchema,
    questionId: z.string().min(1).max(128),
    turn: z.number().int().min(0),
    answer: z.string().trim().min(1).max(1000),
  })
  .strict();

export type LearnerInput = z.infer<typeof learnerInputSchema>;
export type WritingInput = z.infer<typeof writingInputSchema>;
export type AnswerInput = z.infer<typeof answerInputSchema>;
export type Grade = z.infer<typeof gradeSchema>;
export type RecordStatus = "active" | "suspended" | "deleting" | "deleted";

/** Must originate in a server-side Firebase verifier, never request JSON. */
export type VerifiedParentIdentity = Readonly<{
  uid: string;
  email: string;
  emailVerified: boolean;
  authTimeMs: number;
  tokenExpiresAtMs: number;
}>;
export type Family = Readonly<{
  id: string;
  ownerUid: string;
  status: RecordStatus;
  schemaVersion: 1;
}>;
export type Membership = Readonly<{
  familyId: string;
  uid: string;
  role: "owner" | "parent";
  status: "active" | "revoked";
}>;
export type Learner = Readonly<{
  id: string;
  familyId: string;
  nickname: string;
  grade: Grade;
  status: "active" | "archived" | "deleting" | "deleted";
  accessVersion: number;
}>;
/** Loaded by a hash of an opaque cookie; never accept these fields from a client. */
export type ParentGrant = Readonly<{
  kind: "parent";
  uid: string;
  /** Null is a pending-enrolment grant: it confers no family access. */
  familyId: string | null;
  expiresAtMs: number;
  revokedAtMs: number | null;
}>;
export type ChildGrant = Readonly<{
  kind: "learner";
  familyId: string;
  learnerId: string;
  accessVersion: number;
  expiresAtMs: number;
  revokedAtMs: number | null;
}>;

export type ParentContext = Readonly<{
  kind: "parent";
  familyId: string;
  uid: string;
  role: Membership["role"];
}>;
export type ChildContext = Readonly<{
  kind: "learner";
  familyId: string;
  learnerId: string;
}>;
export type FamilyContext = ParentContext | ChildContext;
/** Invitation administration does not confer access to other families' children. */
export type PlatformAdminContext = Readonly<{
  kind: "platform-admin";
  uid: string;
}>;
export type FamilyInvitation = Readonly<{
  id: string;
  kind: "family-owner";
  invitedEmailHash: string;
  tokenHash: string;
  invitedByUid: string;
  status: "pending" | "accepted" | "revoked";
  expiresAtMs: number;
  acceptedByUid: string | null;
}>;
