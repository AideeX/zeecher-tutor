# Implementation status — Learning Coach Nigeria

Validated on **23 October 2026** in the restored cloud environment. The local development workflow and a working first implementation are ready. The complete product/curriculum specification remains **partial**; this is not a fully verified current NERDC tutor or complete entrance-exam simulator.

The repository originally contained only LICENSE. The supplied build prompt/addendum/resource manifest are preserved under docs/. No original Next.js starter, AGENTS file, acceptance suite or 432-topic inventory was supplied. The new app, tests and small original inventory were created here. No real parent/child records were created in the normal app database during implementation.

## What works

| Capability | Status | Evidence |
|---|---|---|
| Next.js App Router/React/TypeScript app; persistent local SQLite; versioned migrations | done | app/, lib/db.ts, migrations/; process-restart test |
| First-family setup, salted scrypt login, hashed/expiring session tokens, parent locking on child launch | done for local workflow | lib/security.ts; browser family flow |
| Separate Explorer P2 and Challenger P5 data; ownership checks on sensitive routes | done | API ownership/launch/export tests; writing isolation |
| Six modules with original deterministic learning/practice questions | done within sample bank | lib/content.ts, lib/science.ts; 54 objectives / 1,258 distinct assessment IDs |
| P1/P4 repair, P2/P5 core, gated P3/P6 stretch; parent-gated P5 entrance subset | done within sample bank | engine progression and API gate checks |
| Not-taught, forgotten, hint and alternate teaching; one question at a time | done within scripted lessons | help events; browser assisted/independent and refresher checks |
| Independent versus assisted/repeated evidence; provisional mastery and spaced review | done with fixed initial thresholds | lib/engine.ts; mastery/equivalence tests |
| Six-question diagnostics, stale submission rejection, lesson resume | done | browser diagnostic and resume checks |
| Cross-skill early-session recap aggregation | done | API finish selects all attempts for the owned session; no full end-to-end early-diagnostic recap assertion |
| Original reading passages and saved/revised typed compositions | done with local checklist feedback | browser writing revisions; five-part provisional checklist |
| Deterministic SVG quarter-turn reasoning | done for this question family | key verification and keyboard/radio controls; browser selection |
| Parent reports, question history, Basic Science line, JSON/CSV export, learner purge, full account deletion | done | browser family/deletion flows; API routes |
| Parent session length, weekly days, pause, stretch, entrance settings; editable term/week map and review notes | done within current controls | parent forms and browser settings/map tests |
| Balanced weekly suggestions include all six modules | done | engine check for P2 and P5; extra English slot |
| Local-only child mode; child-to-AI endpoint blocked even if a flag is set without implementation | done | /api/ai; browser rejection; no provider calls |
| Private local PDF ingestion, source/page hashes and candidate SQLite storage | done as an unreviewed extraction pipeline | scripts/import_curriculum.py; Python corpus checks |
| Candidate deduplication and branded-source quarantine | done | 4,180 consistent unique rows; 11 exact repeats removed; 660 near-matching pages; deterministic repeat import |
| Source review queue, official reference links/access status and source audit | done for the reviewed sample | parent Sources view; data/official-source-checks.json; docs/CURRICULUM_SOURCE_AUDIT.md |
| Desktop/mobile UI and learner/parent Axe A/AA checks | done for exercised screens | browser flows; docs/screenshots/ |

## Validation actually executed

| Command/check | Outcome |
|---|---|
| npm ci --cache /workspace/.npm-cache --no-audit --no-fund | Passed; frozen lockfile installation replay |
| npm run setup | Passed; migrations/seeds and private initial setup-code handling |
| Optional importer venv + pinned PyMuPDF install | Passed |
| npm run typecheck | Passed |
| npm run lint | Passed |
| npm test | **9 passed**, zero failed/skipped |
| npm run test:curriculum | **4 passed**, zero failed/skipped; private corpus present |
| npm run test:e2e | **3 passed**, zero failed/skipped, Chromium against development server |
| npm run build | Passed using supported Webpack option; TypeScript and production route generation passed |
| npm run test:e2e:production | **3 passed**, same browser flows against the production bundle and isolated temporary data |
| Production startup on port 3000 | Started; initial account-setup screen and /api/state HTTP 200 verified without creating a family |
| Production file traces | Six trace manifests inspected; **zero** reference-pdfs, .local or attachments paths included |
| Repeat private import | Full audit hashes identical; JSON/SQLite both contain 4,180 unique records |
| Git/data hygiene | Original LICENSE unchanged; all five PDFs, app database and setup code ignored |

The browser suites include setup/login, sibling isolation, help, assisted and independent answers, writing revisions, exports/deletion, curriculum edits, source warnings, SVG selection, CSRF rejection, diagnostics, repeated submission rejection, stretch/exam gating, family deletion, mobile overflow and Axe checks. The three browser flows were executed in both development and production; these are repeated runs of the same scenarios, not six distinct scenario definitions.

The default Turbopack production build failed while following the private Python virtualenv symlink during filesystem tracing. The supported `next build --webpack` path is now the package build command and passes with private-input exclusions. Development still uses the tested default dev bundler. No integrity/TLS checks or test assertions were disabled.

## Milestones and remaining limitations

- **Milestone A — partial:** storage, original seed map, local lessons, source metadata and planner work. Complete official revised grade/subject mapping and reviewed import approval remain outstanding. All extracted rows remain low-confidence candidates and cannot automatically become lessons.
- **Milestone B — partial:** help flows, deterministic assessment, diagnostics, writing revisions, reports and scheduling work within the small sample. Broader maths operations, detailed phonics/grammar, richer passages, additional non-verbal families, stronger misconception diagnosis and parent-adjustable mastery/proficiency overrides are not complete. Term/week edits are planning metadata; the planner does not yet implement a complete school-term calendar.
- **Milestone C — partial:** local authentication, ownership, storage, export/deletion and privacy blocking work. No child-to-model provider, approved ZDR arrangement, hosted account recovery, complete privacy/legal assessment or production operations/security audit is supplied. External AI remains off. The local writing checklist cannot semantically assess a composition.
- **Milestone D — partial:** responsive UI, tested flows, source documentation and run instructions exist. This is a persistent-disk Node application, not a deployed service or an ephemeral-serverless database implementation. Accessibility scans covered exercised learner/parent pages, not a certification of every state/device.

The source audit records current NERDC grade-detail access failures: P1/P2/P4/P5 return 403; P3/P6 return 404. The index, official 2025 subject notice, selected official legacy PDFs, 2026 NECO notice and API under-18 guidance were retrieved successfully after network access was restored. No bypass was attempted. Limited legacy spot checks do not certify full current coverage. The 12-page Lagos excerpt does not supply P2/P3 chapters. Source rights/publication claims and candidate cell/grade layouts still need review.

NCEE practice is an original subset with a source-dated 2026 structure, not complete/timed official papers. Vocational coverage and school-specific mapping are incomplete; no target school was selected. Reasoning is labelled enrichment. There are no invented pass marks or full-curriculum percentages.

## Run and review

See README.md. Start with `npm run setup`, then `npm run dev`, or use the verified production build with `npm run start`. Do not run the development and production servers on the same port. The current instance has the production server on port 3000; processes must be restarted after an environment restore.

The operator privately reads `.local/setup-code` to create the initial parent account. Never publish that code, private PDFs or family data. Keep SQLite on persistent private storage; HTTPS hosting requires exact APP_ORIGIN and secure cookies. Environment configuration saving and publication are separate; a successful draft save does not execute scripts or validate a fresh task.

## Next three improvements

1. Secure lawful access to revised grade outcomes; review candidate layouts, conflicts, source rights and grade/term/week crosswalks before approving more curriculum content.
2. Expand original current-grade banks, transfer tasks, English composition/grammar review and non-verbal reasoning families, with educator review and independent assessments.
3. Add parent proficiency overrides and richer planning, then prepare persistent hosted storage/auth operations and a privacy/security review. Keep child-to-model processing blocked until any future provider satisfies current under-13 prerequisites.

## Verification after the user's publication

The published environment was successfully accessed and the existing application retained. No application logic, tests, dependency declarations or lockfile were changed during this verification. The previously completed import fix was already present and passed without replacing it. File hashes confirmed that all existing non-ignored files were unchanged before this documentation update.

A full private import was rerun. The audit is byte-identical to the restored audit; JSON, SQLite and public summary all contain 4,180 unique records. All record IDs and private metadata were compared, not only row counts. Eleven identical candidate repeats remain consistently removed. The four Python corpus tests passed after the fresh import.

Fresh verification results: typecheck and lint passed; 9 Node tests passed; 4 Python tests passed; all 3 browser flows passed against development and again against production; the final `npm run build` passed using the existing Webpack build command. No failed, skipped or disabled tests remained. Six production trace manifests were checked with zero private input/runtime paths.

The production server was restarted on port 3000 because processes do not survive publication. The `/api/state` response and the appropriate initial browser screen were checked without creating or resetting family records. Published install/start instructions were read and remain applicable; no new environment configuration draft was required.

README now explains the distinction between a published environment and a public website, links screenshots, and gives exact steps for running an interactive local preview from the provided source archive. The archive excludes private corpus/data/auth files and is kept under ignored `.local/artifacts/`. All limitations in the milestones above remain in effect.

## Firebase migration Phase 1 — 24 October 2026

Scope: preservation baseline and inactive integration architecture only. Original active application, engine, content, SQL migrations and existing tests remain unchanged. SQLite remains the active storage/authentication implementation. Firebase Auth/Firestore SDK integration, live family provisioning, multi-profile UI, cloud setup and public deployment have not started.

Added family/learner/domain contracts (P1–P6), pure ownership/role/session-grant guards, administrator invitation boundaries, family-scoped paths, asynchronous repository/service ports, configuration validation and a server-only diagnostic module. Added closed, undeployed Firestore rules, draft indexes, loopback emulator configuration, commented future environment variables and beginner setup documentation. The sole new runtime dependency is `server-only@0.0.1`; no Firebase SDK or connection is initialized.

Preservation uses 52 pre-phase file hashes, a golden curriculum/assessment fingerprint, a 22-file active-code/data/test check, and private read-only database inventory. New tests exercise family/sibling isolation guards, administrator limits, expired/revoked grants, tenant/score injection, P1–P6 boundaries, emulator misconfiguration, secret redaction, and read-only SQLite inventory. These are foundation unit/SQLite integration checks; real Firebase Auth, Firestore rule/emulator and cloud integration tests are deferred to Phase 2.

Proposals awaiting approval: Johannesburg (`africa-south1`) with Vercel Cape Town (`cpt1`), after Nigeria latency/cost/privacy checks; raw activity 90 days, writing 180 days, backups 30 days, with minimized mastery evidence retained separately. No location is selected and no retention deletion is enabled. See docs/firebase/REGION_AND_RETENTION.md.

Phase 1 final verification: **passed** — typecheck, lint, all 31 Node tests, 4 corpus tests, 3 development browser flows, production build and the same 3 production browser flows. The 22-file active-code preservation check and full curriculum/assessment fingerprints pass. See docs/firebase/PHASE_1.md for scope and evidence. Stop after this phase and explain Phase 2 before proceeding, as requested. No Firebase/Vercel configuration is currently required from the owner.
