# Firebase architecture boundaries

Status: Phase 1 foundation only; no connection or deployment.

## Request and trust boundaries

Parent browser -> Firebase email/password sign-in -> Next.js session exchange -> server-verified identity and active device grant -> family membership -> family-scoped repository. Child browser -> opaque learner grant -> active family and learner -> learner-scoped service. The deterministic engine remains independent of both storage implementations.

`VerifiedParentIdentity` must come from Firebase Admin verification in Phase 2, including signature, issuer, audience, expiry, revocation and verified email. Phase 1's pure guards do NOT verify a token. They must never be called with identity, membership or grant objects taken from request JSON. Phase 2 repositories must load server-owned documents, authorize them, then construct a scoped context for each request. Never cache a current family/user in a module singleton.

Use secure HttpOnly host-only cookies, SameSite protection, explicit Origin/CSRF checks and recent authentication for sensitive actions. Firebase client persistence must not retain a parent refresh token on a shared child device. A device grant makes parent locking independently revocable. Child launch invalidates that device's adult grant; token expiry is checked on every request, independent of delayed TTL cleanup.

A parent grant with no family is pending enrolment only: it cannot read family records. The operator-configured `ZEECHER_PLATFORM_ADMIN_UID` identifies the verified adult allowed to issue family-owner invitations. It is never accepted from the browser. Administrator invitation access also requires a live device grant and recent authentication. It does not confer a family-data context or automatic access to another family's writing or progress.

Initial provisioning supports one owner account per family. Membership roles include `parent` for later co-parent support, but this does not enable co-parent invitations now. Ordinary uninvited Firebase accounts, if created through Firebase's public Auth APIs, receive no family membership or platform access. Hide-and-show UI is not an invitation control. Invitations must be single-use, expiry-checked, token-hashed and bound to the verified adult email; provisioning must be transactional/idempotent.

## Data model and legacy mapping

| Existing SQLite data | Future location / handling |
|---|---|
| Parent credentials | Fresh Firebase Auth account; no password-hash migration |
| Parent-to-family link | Private `users/{uid}` plus authoritative `families/{fid}/members/{uid}` |
| Learner/settings | `families/{fid}/learners/{lid}`; nickname, P1–P6 grade, minimal settings, access version |
| Lesson sessions | Learner subcollection `sessions/{sid}` |
| Attempts/help | Learner subcollections `attempts/{aid}` and `helpEvents/{hid}`; server evaluated |
| Retention evidence | Minimized `evidence` retained independently of removable raw `activityDetails` |
| Review schedule / derived progress | Learner `reviewSchedule/{skillId}` and `progress/{skillId}` |
| Writing revisions | Learner `drafts/{did}/revisions/{rid}`; append revisions, scope reads |
| Original curriculum/source/sequence | Existing versioned read-only code and original metadata remain canonical |
| Parent curriculum edits | `families/{fid}/curriculumOverrides/{outcomeId}` |
| Parent conflict reviews | `families/{fid}/curriculumReviews/{conflictId}`; canonical factual concerns remain unchanged |
| Audit | Family-scoped minimal audit events; do not log child text |
| Auth sessions | Replace with Firebase cookies + hashed opaque grants; force fresh login at cutover |
| Rate limits | Distributed per-operation/account/IP limits with privacy-preserving IP HMAC, not the current single global login bucket |
| Export/deletion | Family-authorized jobs with immediate access revocation and durable, retryable recursive cleanup |

Domain time values are milliseconds to preserve the current pure engine. A future adapter converts to/from Firestore Timestamp at the boundary. Index documents use persisted `createdAt`/`startedAt` fields; indexes and query tests must match the real adapter before deployment. User-facing times remain Africa/Lagos.

Repository ports are compile-time service boundaries, not implementations or security guarantees. There is no runtime `firestore` backend option yet. `canConnect: false` is returned by all Phase 1 configuration inspection paths, including apparently complete credentials. No Firebase SDK is installed, and the active Next.js API still imports the original SQLite modules.

## Authorization model

- Owner: own family's records, learners and settings; owner-only family deletion with recent authentication.
- Later parent member: family child records/controls; no owner-only membership or family-deletion privilege.
- Learner: only its assigned learner's permitted lessons, writing and progress; no parent controls.
- Platform administrator: invitations and eventual family administrative status; no implicit child-data bypass.
- Anonymous/uninvited/unrelated family: no private records.

Firestore document paths are derived from a server-authorized context. Reject traversal, mismatched family/learner metadata, revoked grants, inactive members, archived/deleting learners and suspended/deleting families. Client input schemas reject family IDs, roles, birthdates and server-calculated scores in the corresponding profile/writing/answer payloads.

The draft rules deny all direct browser/mobile Firestore reads/writes, including signed-in users. This is compatible with API-mediated access. Admin/server SDKs bypass Firestore rules, so every API/service operation must still authorize its family/learner scope. Tests of both layers are required; rules do not fix an Admin SDK authorization bug.

## Preserve existing learning behaviour

Preserve current question IDs, answer keys, original passages, SVG reasoning, help actions, diagnostic steps, evidence flags, recap behaviour, revision history, parent exports/deletion, source warnings and separate sibling progress. Do not expand/relabel curriculum verification as part of the storage migration.

Atomic/idempotent service operations must prevent duplicate answer credit, race conditions between help and answer, or repeated question instances counting as independent mastery. Use the existing pure engine to derive progress and a reconciliation utility to rebuild projections from retained evidence. Transaction retries must not send email or perform other external side effects.

The new profile schemas support P1–P6, but active profile creation and hardcoded legacy P2/P5 UI/entrance guards are not switched in Phase 1. Later work must cover P1/P6 boundaries and parent-approved upper-primary entrance practice without assuming that every supported grade has complete curriculum coverage.

## Vercel and operations

Use Next.js Node runtime and server-only Firebase Admin modules. No hosted handler may rely on a local SQLite file, setup-code file or private PDF corpus after cutover. Keep the importer as an offline developer workflow. Do not seed families or rewrite global curriculum during cold starts.

Prefer Vercel OIDC -> Google Workload Identity Federation -> a least-privileged runtime service account. Test Auth session-cookie operations and Firestore access with that identity before choosing any private-key fallback. Separate runtime, migration and deletion-worker identities where appropriate. Never place credentials in NEXT_PUBLIC variables.

Production/staging need separate Firebase projects and Vercel secrets. Preview deployments must not receive production data permissions. Enforce secure cookies and reject emulator configuration in production. Use no-store private responses and no shared-user response cache. Protect login/session-exchange/provisioning endpoints against CSRF and distributed abuse; billing alerts are not spending caps.

## Migration and deletion gates

Before copying any real data: approve location, confirm parent-to-Firebase UID mapping, create an encrypted consistent backup and test restoration, run synthetic migration/rules/API tests, and obtain appropriate privacy approvals. Import original record IDs/timestamps where possible, reject orphan records, compare counts/metadata and recompute learning outputs. Do not delete the legacy store after an unverified import.

Firestore does not cascade-delete subcollections. Mark records deleting and deny access immediately; use durable jobs for bounded recursive deletion, retries and proof of completion. Check grant expiry directly; TTL is only eventual cleanup. Preserve minimal assessment evidence when raw responses expire so retention cannot silently erase mastery history. Backup deletion follows the disclosed backup retention window.
