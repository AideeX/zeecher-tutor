# Firebase migration — Phase 1

Date: 24 October 2026. Base application commit: `0d1b82448d885683cf018ca977681d9c39f44945`.

## Scope and stopping point

This phase establishes a preservation baseline and prepares integration boundaries. It does not activate Firebase, create a Firestore database, select a database region, create Auth users, upload child records, deploy rules or deploy publicly. Existing Next.js handlers, SQLite storage, child teaching UI and learning logic remain active and unchanged.

The application is still a single-family SQLite application at runtime. The new family-isolation helpers are tested building blocks, not evidence that the existing handlers are already multi-family Firestore handlers. It is not yet ready for public Vercel deployment.

## Approved decisions

- Private invitation-only platform; the owner controls family invitations as platform administrator.
- Firebase email/password parent authentication; no Google or anonymous child sign-in initially.
- One parent account per family initially; membership schema allows authorized additional parents later.
- Student profile contracts cover Primary 1–6. Preserve Explorer/P2 and Challenger/P5 as the owner's defaults; other families choose supported grades. Live profile-management endpoints and UI will change in later phases.
- Fresh Firebase enrolment, with verified parent email mapping for any existing learning records. Do not migrate password hashes or active sessions.
- Server-mediated Firestore access, strict family/learner ownership, and no automatic administrator access to other families' child content.
- Preserve original curriculum, source references, assessment keys, assisted/repeated/independent evidence, learning engine, writing revisions and existing privacy controls.
- Child-to-AI requests remain blocked. A future provider is a separate reviewed integration, not part of this migration.
- Vercel-compatible Node runtime after durable Firestore integration; no local filesystem database in the eventual hosted request path.
- Database creation waits for explicit location approval. No location is selected in this phase.

## Artifacts

| Artifact | Purpose |
|---|---|
| `PRESERVATION_BASELINE.json` | Hashes of all 52 pre-phase tracked files plus original curriculum/assessment fingerprints; no child records |
| `tests/fixtures/firebase-preservation.json` | Golden pre-migration output fingerprints and inventory counts |
| `scripts/migration/verify-baseline.ts` | Confirms the 22 existing application/data/migration/test/helper files are unchanged during this phase |
| `scripts/migration/inventory.ts` | Read-only SQLite schema/count/orphan inventory; output is private and ignored |
| `lib/firebase/domain.ts` | Family, membership, P1–P6 learner, invitation and session-grant contracts; strict request allowlists |
| `lib/firebase/authorization.ts` | Pure ownership/role/expiry/revocation guards for future server adapters |
| `lib/firebase/paths.ts` | Family-scoped path construction with child-scope and traversal checks |
| `lib/firebase/repositories.ts` | Async identity, invitation, grant, learner, learning, writing, curriculum and privacy ports |
| `lib/firebase/configuration.ts` | Pure validation of configuration, project matching, credential presence and emulator safety |
| `lib/firebase/server.ts` | `server-only` boundary; diagnostic only, no SDK initialization |
| `firestore.rules` | Closed browser/client-access draft; not deployed |
| `firestore.indexes.json` | Initial index plan; verify against actual adapter queries in Phase 2 |
| `firebase.json` | Loopback-only emulator configuration and local rules/index paths; no project binding |
| `.env.example` | Commented future variable names; existing SQLite settings preserved |

Only `server-only@0.0.1` is added as a runtime dependency. Firebase client/Admin SDKs are deliberately deferred to Phase 2. No new integration module is imported by an active handler or client component.

## Preservation checks

The baseline contains 54 original teaching objectives and 1,258 distinct assessment IDs. Golden tests compare the full curriculum/provenance and generated assessment outputs to their pre-phase fingerprints. The existing engine is additionally checked at all P1–P6 boundaries; it does not select a grade 0 or grade 7 skill.

The existing source audit, 4,180-row private candidate import, all five input PDFs and source classifications remain unchanged. No raw PDF tables are promoted to approved content.

`npm run migration:inventory` opens the legacy database read-only with query-only mode and a consistent read transaction. It reads table counts, schema version and foreign-key violation counts, not record contents or credentials. Its private result is mode 0600 under ignored `.local/migration/`. If no database exists, it records that fact without creating one. This inventory is NOT an encrypted backup and is NOT a data migration. A proper encrypted backup and restoration test are required before any actual cutover.

## Verification

Run from the existing checkout:

```sh
npm run migration:inventory
npm run migration:verify-baseline
npm run typecheck
npm run lint
npm test
npm run test:curriculum
npm run test:e2e
npm run build
npm run test:e2e:production
```

Verification status: **passed, 24 October 2026**. Existing tests were preserved.

| Check | Result |
|---|---|
| Pre-change baseline | 9 existing Node tests and 4 corpus tests passed |
| Active-code preservation | All 22 pre-existing application/data/migration/test/helper files unchanged |
| Curriculum/assessment preservation | 54 objectives and 1,258 distinct assessment IDs; full golden fingerprints unchanged |
| Read-only inventory | Passed; private count/schema/orphan report recorded without reading/exporting record contents |
| Typecheck and lint | Passed |
| Node tests | **31 passed**, including all 9 original tests and 22 new foundation/preservation/inventory tests |
| Corpus tests | **4 passed**; original private PDFs and import records unchanged |
| Development browser flows | **3 passed** |
| Production build | Passed, existing Webpack build command |
| Production browser flows | **3 passed**, same scenarios against the production bundle |
| Dependency preservation | Only `server-only@0.0.1` added; all existing package versions unchanged |
| Restored local server | Port 3000, HTTP 200 and initial browser screen verified |
| Private-artifact check | No private inputs/records in production traces or intended Git files |

No test assertions were disabled. The inventory integration checks use temporary synthetic SQLite fixtures; they prove read-only preservation, not Firestore behaviour.

These tests do not verify Firebase token signatures or deployed Firestore rules. Firebase Auth, Firestore emulator/rules integration, Vercel OIDC and live cloud checks belong to later phases. There is no claim of completed Firebase integration or public-deployment safety.

## Next phase, not started

Phase 2 will install the Firebase SDKs, implement the server identity/session provider and emulator-backed Firestore repositories, and add real Auth/rules/database integration tests with synthetic data. Local demo-project emulators do not create a hosted Firebase database. Before hosted setup, approve the proposed location using REGION_AND_RETENTION.md and follow the beginner guide with explicit checkpoints. Invite-only provisioning, administrator tools, multi-profile UI and final cutover follow in separate phases. Stop for configuration/approval when required; never upload real children’s records merely to test connectivity.
