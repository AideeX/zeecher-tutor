# Learning Coach Nigeria

A working local tutor for a parent-managed family, with separate Primary 2 (Explorer) and Primary 5 (Challenger) journeys. Built with Next.js App Router, React, TypeScript and SQLite. It works without an AI API key.

**Firebase migration Phase 1:** preservation and integration foundations are prepared, but Firebase is not connected. The app still uses SQLite. See [Phase 1 scope](docs/firebase/PHASE_1.md), [architecture](docs/firebase/ARCHITECTURE.md), [location/retention proposals](docs/firebase/REGION_AND_RETENTION.md) and [future setup checkpoints](docs/firebase/FIREBASE_SETUP.md). Do not create a Firestore database until its location is approved.

This is a tested first implementation, with a small original teaching bank. It is **not** an exhaustive, verified NERDC curriculum or a complete entrance-exam simulator. See [implementation evidence](IMPLEMENTATION_STATUS.md) and [source audit](docs/CURRICULUM_SOURCE_AUDIT.md).

## Run

Requires Node **24+**, npm and a writable private filesystem. Use the existing checkout; do not create another worktree.

```sh
cd /workspace/zeecher-tutor
npm ci --cache /workspace/.npm-cache
npm run setup
npm run dev
```

The app listens on port 3000. The first-family screen needs the one-time code stored in `.local/setup-code`; inspect that file privately and enter it in the screen. Do not share or commit the code. Choose your own parent username and password (12 characters minimum). No real parent account was pre-created during development.

To test a production build:

```sh
npm run build
npm run start
```

Production builds use the supported Webpack option because Turbopack 16.4.3 fails while tracing the private Python virtual environment. Runtime data and PDFs remain excluded from deployment traces.

Stop the development server before running browser tests or building: both use Next.js output directories. Processes do not survive environment snapshots; restart the server in each new task.

## What you can do

- Create a parent account; launch one child at a time. Launching child mode revokes the parent session, so switching profiles requires signing in again.
- Learn and practise across six modules, including separately tracked Basic Science, original reading passages, equivalent fractions and deterministic SVG quarter-turn questions.
- Ask for first-principles teaching, a refresher, a hint or another explanation. Assisted and repeated successes remain separate from fresh independent evidence.
- Run a six-question subject diagnostic; wrong answers can route the next check to a prerequisite.
- Write, save and revise compositions with a local five-part checklist. This is provisional checklist feedback, not automated semantic marking.
- See a weekly rotation, save parent planning preferences, inspect progress/review dates and question history, edit term/week placements with an audit note, and review source conflicts.
- Export learner progress to JSON/CSV, or delete their learning records. JSON includes writing, which can contain personal information even though account identifiers are omitted.

Stretch is off by default. Next-grade access also requires retained independent evidence for the current module. Entrance practice is off for P2 and requires parent enablement for P5. Historical NCEE configuration is a sample-practice pathway; only supplied 2026 information is represented, with no current-year or official-question claim.

## Private curriculum references

Original uploaded PDFs are retained under ignored `reference-pdfs/`, with filenames intact. Never put them in `public/`, commit them, or upload them with a deployment.

```sh
# PyMuPDF is already installed in this cloud environment.
# Else install the pinned optional importer requirement in a virtual environment.
python3 -m venv .local/import-venv
.local/import-venv/bin/pip install -r requirements-import.txt
.local/import-venv/bin/python scripts/import_curriculum.py
```

In the current environment `npm run import:curriculum` also works. Text extraction is deterministic, with OCR attempted only for image pages lacking usable text. Tesseract is optional for those pages. Raw extraction, page hashes, duplicate matches and candidate tables stay in `.local/`. `data/source-audit.json` contains only metadata/counts. The candidate SQLite database is separate from the app database: unreviewed material cannot become child lessons automatically.

The extraction preserves uncertain rows rather than pretending table layout is solved. Near-duplicates in the branded compilation are matched by five-word shingle similarity; remaining branded variants are quarantined. The 12-page Lagos excerpt does not supply P2/P3 chapters. See [coverage matrix](docs/CURRICULUM_COVERAGE_MATRIX.md).

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run test:curriculum
npm run test:e2e
npm run build
npm run test:e2e:production
```

Browser tests use a fresh temporary database and generated fixture credentials. They prefer `/usr/bin/chromium` when present. Else install Playwright Chromium with a writable `PLAYWRIGHT_BROWSERS_PATH` and the required network access. Browser screenshots are captured in ignored `test-results/`; selected non-sensitive examples are in `docs/screenshots/`. Tests never create accounts in your normal `.local/coach.sqlite`.

`npm run inventory` regenerates the original objective metadata JSON and CSV from `lib/content.ts`; this is an editorial development command, not an install step.

## Persistence and deployment

`COACH_DATA_DIR` defaults to `.local/`. It holds the SQLite database, WAL files and initial setup code. Keep it private and on persistent storage. Do not share a family-data snapshot publicly. Backups can retain deleted data; manage their retention separately.

This SQLite version needs a long-lived Node server with a persistent disk. It is **not suitable for Vercel's ephemeral serverless filesystem** without a database adapter. For a hosted deployment, provide HTTPS, set `APP_ORIGIN` to the exact public origin and `COOKIE_SECURE=true`, protect disk/backups and complete a privacy/security review. Hosting was not performed.

No child-to-model provider is implemented. `/api/ai` rejects requests even if `UNDER13_AI_ENABLED=true`; the flag cannot bypass the missing compliance controls. See [privacy notes](docs/PRIVACY_AND_SAFETY.md). No commercial features, external web search, ads, sibling leaderboards or direct messages are included.

## Preview after restoring a published environment

Publishing this cloud environment restores its prepared files; it does not deploy a public website. The onboarding chat does not expose a live browser preview for the server's loopback address. A running port 3000 here is available for internal validation, not a public application link.

For a visual preview, open [Explorer on desktop](docs/screenshots/explorer-desktop.png), [Challenger on mobile](docs/screenshots/challenger-mobile.png), [a maths lesson](docs/screenshots/maths-lesson.png) or [the parent dashboard](docs/screenshots/parent-dashboard.png). These screenshots use temporary test data.

For an interactive preview on your own computer, use the source archive supplied with the verification report. It contains the current application, migrations, original sample content, lockfile and documentation; it excludes private PDFs, setup codes, credentials, family data, dependencies and build output. The original application is committed to Git. Select the branch containing the work you want to preview; a previously supplied archive will not automatically include later migration phases.

Install Node 24 or newer. Extract the archive, then run:

```sh
cd zeecher-tutor
npm ci
npm run setup
npm run build
npm run start
```

Open your computer's local server on port 3000 in a browser. Privately open the newly generated `.local/setup-code` file and enter the code in the setup screen, then choose your parent username/password. No AI API key or private PDFs are required to try the original sample lessons. The source archive does not include the cloud machine's family data.

For a remotely accessible live site, deploy to a Node host with persistent private storage, HTTPS, an exact APP_ORIGIN and secure cookies. No public deployment has been performed.
