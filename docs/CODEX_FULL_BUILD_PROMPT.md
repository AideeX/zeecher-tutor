# COPY EVERYTHING BELOW INTO CODEX

You are Codex acting as a senior full-stack engineer, learning-science specialist, Nigerian primary curriculum researcher, child-safety engineer, product designer, and test engineer. Build a **working**, responsive web application called **Learning Coach Nigeria** from this repository. The user wants a real, curriculum-driven AI tutoring system for two children, not a landing page, concept, Figma mockup, or single chatbot.

## 0. Required starting behaviour

1. Read `README.md`, `AGENTS.md`, `docs/MASTER_TUTOR_PROMPT.md`, `docs/CURRICULUM_COVERAGE.md`, `docs/RESOURCE_MANIFEST.md`, `docs/ACCEPTANCE_SCENARIOS.md`, `data/curriculum.json`, `docs/CURRICULUM_TOPIC_INVENTORY.csv`, and the existing source files before changing anything.
2. **Continue the existing Next.js/TypeScript repository**; do not discard working code or quietly rebuild a different stack. Inspect and identify deficiencies. Set up a task checklist in `IMPLEMENTATION_STATUS.md` with `done / partial / blocked`, including evidence and tests.
3. Work iteratively. For each substantial module, implement real functionality, run available typechecks, tests and builds, fix failures, and document missing credentials or inaccessible external resources. Do not claim tests passed if not run.
4. Inspect official sources directly when internet access is available. If official revised curriculum documents are inaccessible, explicitly record `source_status: inaccessible` rather than fabricate their details. Never copy an entire copyrighted book or commercial past paper into the repository.
5. Prefer a high-quality, tested vertical slice over fragile simulated completeness. You may divide work into milestones, but implement as much as possible without asking for routine choices. Report blockers concisely at the end.

## 1. Configuration: decisions already made

- Product: personal, parent-managed AI tutor for a Nigerian family, with possible future expansion; **no commercial features, ads, public leaderboards, or social functions**.
- Target region and language: Lagos, Nigeria; British/Nigerian English; `Africa/Lagos` timezone; Nigerian school terminology; ₦ examples where appropriate.
- Exactly two independent profiles, editable **nicknames only**:
  - **Explorer (Primary 2)**: P2 core; P1 prerequisite repair; optional P3 stretch after demonstrating readiness.
  - **Challenger (Primary 5)**: P5 core; P4 prerequisite repair; optional P6 stretch; national Common Entrance + broad Lagos private secondary-school entrance preparation.
- Default session length: **25 minutes**, user adjustable within **20–30 minutes** in parent settings. A session should have a meaningful conclusion if stopped early; do not force the child to rush.
- Secondary target school: **not selected**. Default to general entrance preparation rather than an individual school's claimed syllabus. Give parent optional, evidence-based school profiles later.
- Curriculum: use **official NERDC** primary-school documents and label revisions accurately; no school-specific scheme of work is available.
- Main learning modules: **Mathematics, English Language, Verbal Reasoning, Quantitative Reasoning, General Paper and Non-Verbal Reasoning**. **Basic Science must be independently visible and trackable within General Paper**. General Paper also includes Social Studies, Civic/National Values, basic geography/history, science/technology, digital literacy and age-appropriate vocational knowledge.
- The ability to **actually teach** when children select “I haven't learnt this yet”, “I've forgotten”, “Give me a hint”, or “Explain another way” is non-negotiable.

## 2. Source reliability: curriculum before content

Refer to `docs/RESOURCE_MANIFEST.md` for URLs and statuses. Highest-priority links:

- NERDC revised curriculum index: https://nerdc.gov.ng/content_manager/new_curriculum_home.html
- NERDC legacy index P1–3: https://nerdc.gov.ng/content_manager/pri1-3.html
- NERDC legacy index P4–6: https://nerdc.gov.ng/content_manager/pri4-6.html
- Official legacy Mathematics P1–3: https://nerdc.gov.ng/content_manager/primary/pri1-3_maths.pdf
- Official legacy Mathematics P4–6: https://nerdc.gov.ng/content_manager/primary/pri4-6_maths.pdf
- Official legacy English P1–3: https://nerdc.gov.ng/content_manager/primary/pri1-3_english_studies.pdf
- Official legacy English P4–6: https://nerdc.gov.ng/content_manager/primary/pri4-6_english_studies.pdf
- Official legacy Basic Science/Technology P1–3: https://nerdc.gov.ng/content_manager/primary/pri1-3_basic_science_technology.pdf
- Official legacy Basic Science/Technology P4–6: https://nerdc.gov.ng/content_manager/primary/pri4-6_basic_science_technology.pdf
- Official legacy National Values P1–3: https://nerdc.gov.ng/content_manager/primary/pri1-3_nvc.pdf
- Official legacy Pre-Vocational P4–6: https://nerdc.gov.ng/content_manager/primary/pri4-6_prevoc.pdf
- Official NECO NCEE: https://neco.gov.ng/exams/ncee
- NECO 2026 NCEE examination notice (historical structure, must refresh for future years): https://neco.gov.ng/2026%20NCEE%20ADVERT%20AND%20POSTER%20-%20GENERAL%20INFO.pdf

**Critical provenance caveat:** As checked on 23 October 2026, the NERDC revised 2025+ index lists Primary 1–6, but linked grade pages at `lmis.nerdcportals.com.ng` were not reliably accessible (some produced 403/404). Do not claim that the existing 432-topic inventory is a fully verified reproduction of the newest curriculum. It is a first-pass teaching inventory with legacy curriculum grounding plus original entrance enrichment. As official revised documents become accessible, migrate skill references, record revisions and have the parent approve curriculum-version upgrades.

Create/upgrade a documented **curriculum database**: `source -> academic_level -> formal_subject -> domain -> topic -> atomic_skill -> prerequisite -> examples -> assessments`. For every skill save: `skillId`, `grade`, `module`, `strand`, `theme`, `topic`, measurable `objective`, `prerequisiteIds`, `difficultyTier`, `sourceUrl`, `sourceVersion`, `sourcePageOrSection` if verified, `provenance` (`revised_verified | legacy_verified | legacy_inferred | enrichment | entrance_verified`), and `reviewStatus`. Empty information must be null/unknown, never invented. Distinguish *topics* from *individual measurable skill objectives* and *question instances*. Provide parent coverage reports for P1–6 showing verified vs provisional coverage separately.

Develop an **original** question bank with keyed answers and distinct variants for major grade-level skills. Do not present generated practice exercises as authentic NECO past questions. For reasoning strands, create coherent domain taxonomies instead of claiming NERDC has an official standalone verbal/quantitative/non-verbal reasoning curriculum.

## 3. Examination modes and subject boundaries

NECO's published **2026** National Common Entrance (federal Unity Colleges) structure:
- Paper I, Part A: Mathematics and Basic Science & Technology.
- Paper I, Part B: English Studies and National Values Education.
- Paper II, Part A: Quantitative and Vocational Aptitude.
- Paper II, Part B: Verbal Aptitude.

Treat that as 2026 documentary evidence, **not a promised format for 2027 or later**. Provide a source/date label and a configuration system to update future changes. Private schools have their own entrance assessments. Default to **Broad Private Entrance** with English, Maths, Verbal, Quantitative, General Paper, Non-Verbal. Provide NECO NCEE as a separate selectable practice pathway. School-specific modes must only advertise **source-confirmed** tested areas; if a parent has not chosen a school, avoid schools' branding and fabricated pass marks. Include optional writing/composition and mixed papers, plus later timed practice appropriate to child readiness.

## 4. Learner-facing product requirements

Build a beautiful, fast, accessible app that children can use independently with a parent nearby:
- Profile selection: large Explorer / Challenger cards; age-appropriate visual treatment without infantile styling for P5. No sibling scores shown side-by-side.
- Learner home: today’s lesson suggestion, continue a lesson, 6 subject tiles, achievements for persistence/skills (not body/appearance or sibling competition), skills to review, session countdown with optional breaks, and a clear return/home control.
- Subjects: Math (arithmetic, fractions, geometry, measurement, basic algebra and word problems); English (phonics/reading as appropriate, comprehension, vocabulary, grammar, spelling, punctuation, editing, composition); Verbal (analogies, synonyms/antonyms, word groups, letter patterns, codes); Quantitative (patterns, missing numbers, numerical relationships, puzzles); General Paper (Science as separate strand, Social Studies, National Values, geography, history, technology/ICT, vocational); Non-Verbal (actual diagrams, grids, reflection, rotation, matching and spatial transformations).
- Modes: **Learn, Practise, Challenge, Revise, Entrance Practice** (the last only for Challenger and parent-approved). Add a calm diagnostic onboarding of 5–8 mixed, prerequisite-sensitive questions per relevant subject.
- Show a single clearly laid-out question/task at a time; allow typed numeric answers, multiple choice, structured explanation, drag/select diagram when justified, and full text composition. Keyboard and touch accessible.
- Always-visible assistance actions: **I haven't learnt this yet / I've forgotten / Give me a hint / Explain another way**. They are not equivalent to “wrong”. No penalties, shame or negative sounds for needing instruction.
- If “not taught”: explain from first principles at the correct level; demonstrate an analogous worked example; ask one scaffolded check; then pose a new independent transfer item.
- If “forgotten”: use a brief memory cue, retrieval from one earlier skill, and a fresh question.
- If “hint”: give only the smallest next clue, keep original question visible; track hint use.
- If “different explanation”: use an alternate representation, simpler decomposition, Nigerian everyday analogy, fraction strips, place-value blocks, number line, or safe science observation. Never repeat identical text.
- If student replies “I don't understand”: offer visual explanation or 1-step example rather than just repeating the answer.
- Check an answer with an independent verified key/evaluator when feasible; when incorrect, infer error type cautiously and ask the child to explain a step. Accept mathematically equivalent forms, e.g. 1/2 vs 2/4. Do not mark arithmetic based solely on an LLM guess.
- Give feedback on *process*, not only final answers. Avoid instantly disclosing full solutions unless an explanation is requested after a genuine attempt or reteaching requires a worked parallel example.
- For English comprehension provide original or appropriately licensed passages; ask literal, inference and vocabulary questions; allow short answers. For composition provide an actual multi-paragraph editor (draft, feedback, revision) with rubric: relevance, organisation, vocabulary, grammar, punctuation; save drafts only under parent-controlled storage. Never pretend creative writing has one exact answer.
- For science, teach explanations/observation with safe activities requiring simple household items and adult involvement where appropriate. Do not recommend hazardous demonstrations.
- For non-verbal, implement an SVG-based or Canvas-based **deterministic** question engine with generated shape/rotation/reflection matrices, visible answer choices and programmatically verified keys; do not rely on Unicode glyphs or vaguely described images.
- Explain to the child that this is an AI learning assistant and that it can occasionally make mistakes; encourage asking a parent/teacher for confusing feedback.

## 5. 20–30-minute structured lesson orchestration

Default **25 minutes** (configurable 20–30), intentionally flexible:
1. Friendly check-in and warm-up, ~2 minutes.
2. Spaced-retrieval review, ~4 minutes.
3. One main new/current-grade skill and guided instruction, ~12 minutes.
4. Independent practice and optional stretch, ~5 minutes.
5. Celebrate process, summarize learning and identify next review, ~2 minutes.

Don't mechanically enforce exact time blocks. Pauses, reteaching and writing sessions may use more time. Prefer 1 deep subject per session, sometimes a second short skill; never squeeze all 6 subjects into every 25-minute lesson. Build a **weekly balanced coverage planner** that rotates modules and protects reading/writing, maths, and science from neglect. Support the child choosing a subject. For the younger child, default majority P2 and occasional P3 challenge; older child majority P5 plus P6/entrance practice. Treat P1/P4 as repair only when useful. Sessions should end with a one-paragraph child recap and a parent-ready concise report.

## 6. Adaptive engine and mastery semantics

Model *learning* explicitly as separate events from *assessment*:
- Store learner/session/skill/question IDs; original prompt and answer key, response, evaluator method, correctness, supported or unsupported, attempts, hint stages, time, confidence, error category and timestamps. Separate siblings at the database and permission level.
- Do **not** treat viewing a worked example, a repeated question, or a hinted correct response as independent mastery.
- Provisional mastery criteria: at least **3 independently correct answers to 3 distinct items across 2+ separate sessions**, including transfer application, followed by successful spaced retrieval. Make thresholds parent-adjustable; avoid presenting these as scientific certification.
- Review intervals can start at 1/3/7/14 days; reschedule according to evidence. Use a prerequisite DAG and skill selection algorithm: remediate missing prerequisite first, then return to original goal; provide P3/P6 challenge when current foundation is stable.
- Separate independent accuracy, assisted learning, writing growth, curriculum coverage and *exam preparation readiness*. Do not collapse all into a single ungrounded “IQ score”.
- Use deterministic and curated assessments for progress reporting; AI-only subjective feedback should be marked provisional and reviewable by a parent.
- Parent can set grade stretch on/off, exam mode on/off, session time, weekday plan, and manual proficiency edits with an audit note.

## 7. Parent dashboard

Real parent authentication and protected routes (not merely a labelled page). Provide:
- Learner-specific progress overview; topic map P1–6 including source/confidence; independent vs assisted success; missed concepts; question history; retention/revision queue; completed and skipped sessions; writing drafts with revision feedback; weekly coverage; Basic Science as separate reporting line; broad entrance skill coverage for Primary 5.
- Parent weekly learning plan and curriculum gaps (verified, provisional, untouched).
- Controls: 20–30 min session setting (default 25), child-safe pause/quiet-hours choice, difficulty caps, enable/disable exam practice, data minimization, export and delete, choose future target schools, and add a verified scheme of work later (not required now).
- Export anonymized progress to CSV/JSON; purge child records, samples, and raw conversation logs from app-managed storage when parent requests it.
- Clear display of source/date for curriculum assertions and entrance format; flags for newly revised and unverified materials.
- Costs/API usage and daily limits; avoid surprise bills. Protect all admin operations by server-side account ownership checks.

## 8. Safety, privacy, and API compliance — blocking requirements

**Both learners are under 13.** Review https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance and current terms before sending **any child personal data** to OpenAI. The guidance says not to process personal data of children under 13 (or the applicable age of digital consent) through OpenAI services without first implementing **zero data retention (ZDR) in the API**. Treat this as a **launch blocker** for child-input-to-model workflows until the appropriate ZDR arrangement and relevant privacy/legal requirements are satisfied. Never claim ZDR merely because you omit logging, remove names or set request parameters.

Until eligibility and controls are verified, implement a **safe local-first learning mode** using reviewed/static questions, deterministic validators, lesson scripts and offline-style guidance; AI can optionally generate *generic, non-child-specific* learning materials in a parent-admin content pipeline, but must not receive a child's answers, writing, personal data or identifiable learning history. Gate child-to-AI chat behind a clearly documented `UNDER13_AI_ENABLED` server-side feature flag that defaults `false`, and only enable after verified compliance (not via child UI). Avoid building a misleading “AI tutor is fully live” status when the AI backend is disabled.

Apply further safeguards: parent-managed accounts, child nicknames only, minimize personal data and free-text logs, do not collect school name/address/birthdate unnecessarily, allow export/deletion, server-side access checks, output moderation and filtering, don't show unsupervised web search/chat to children, no ads/DMs/leaderboards. Use current documented API moderation tools such as https://developers.openai.com/api/docs/guides/moderation when permitted. Provide age-appropriate content and an escalation route to the parent for distressing or confusing responses. Assess applicable Nigerian child-data/privacy obligations and document assumptions, but don't invent legal compliance certifications.

Always store `OPENAI_API_KEY` **server-side** only; never use `NEXT_PUBLIC_*` for secret tokens. Respect strict per-account quotas, request timeouts, response size limits, input validation, CSRF/session security, logging minimization, and rate limits. Treat all user-supplied text as untrusted. Use current API docs and choose an available model based on actual availability/cost instead of hard-coding an assumed model. Model/API costs are separate from access to Codex.

## 9. Technical architecture (use real code, not pseudocode)

Base: existing Next.js App Router + React + TypeScript. You may add Tailwind CSS or continue CSS, whichever provides a maintainable accessible design. Prefer compatible, current stable packages verified in the runtime; don't blindly bump dependencies. Deployable on Vercel or equivalent.

Create:
- `src` or existing `app`/`lib` structure: separated `curriculum`, `questions`, `learning-engine`, `assessment`, `ui`, `persistence`, `security` concerns.
- Relational storage such as PostgreSQL with Prisma/Drizzle (prefer whichever integrates cleanly), migrations, seed script, typed interfaces and server-only access. Credentials in `.env.example` placeholders. Provide a local development fallback (SQLite where compatible) or an explicitly documented way to run without hosted infrastructure.
- Auth: parent only, scoped authorization; child mode launched through parent-approved profile/session. No public child account creation or direct messaging.
- Defined validated schemas for `Learner`, `Skill`, `Source`, `Question`, `AnswerKey`, `LearnerAttempt`, `HelpEvent`, `Session`, `WritingDraft`, `Revision`, `ReviewSchedule`, `ParentSettings`, and `AuditEvent`.
- Question/lesson planner as a **pure, independently testable** function. Separate deterministic question selection/evaluation from optional natural-language coaching.
- For permitted AI use, OpenAI **Responses API** with strict structured outputs/Zod per https://developers.openai.com/api/docs/guides/structured-outputs and moderation; avoid brittle regex to parse arbitrary responses. Handle incomplete/refused responses gracefully. Validate on the server even after structured output.
- Rendering: Math formatting (accessible typed fractions, equation layout, number lines); SVG diagrams; passages; rich writing editor (simple textarea is sufficient initially if it supports saving/revising); MCQ controls. Print-friendly practice optional.
- Progress visualization that shows coverage and mastery honestly, with no invented analytics.
- Seed data from existing `data/curriculum.json` but mark existing 432 topics as **planning-level / provisional** until individual objectives and source pages are verified. Enrich incrementally and do not generate fictitious page numbers.
- Documentation, unit tests, integration tests, and end-to-end tests if dependencies/runtime permit. Semantic accessibility checks.

## 10. Screens to deliver

1. Parent sign-in / initial family setup.
2. Profile selection (Explorer, Challenger).
3. Learner home dashboard and subject selection.
4. Curriculum skill tree with grade + topic + prerequisite + challenge labels.
5. Lesson workspace displaying progress, current objective, one question, hint/unknown/forgot buttons, and teacher feedback.
6. SVG reasoning question renderer.
7. English comprehension & writing/draft/revise workspace.
8. End-of-session child recap.
9. Parent dashboard (individual progress, subject coverage, mastery vs supported effort, writing samples, review queue).
10. Parent settings, data deletion/export, source provenance and exam pathways.

## 11. Tests and concrete acceptance criteria

Implement tests described in `docs/ACCEPTANCE_SCENARIOS.md`, including:
- Separate sibling accounts/data and authorization (never leak scores or writing across profiles).
- P2 defaults P2, may try P3 stretch only when allowed, cannot enter entrance exam mode by default.
- P5 uses P4 repair, P5 foundation, P6 stretch, and verified separate NECO/private broad exam modes.
- “Not taught” -> explanation + worked parallel example + gentle new task, **not** counted wrong.
- “Forgotten” -> cue + retrieval check; not marked as incompetence.
- Hint -> same unanswered item remains visible; assisted successes don't count as mastery.
- Three distinct independent correct items across sessions can contribute to mastery; guessing or repetition cannot.
- In Maths, 2/4 and 1/2 compare as equivalent; arithmetic key is deterministic. Student reasoning failures are reviewed separately from numerical correctness.
- Every non-verbal item rendered by SVG has a deterministic correct answer and is keyboard usable.
- English writing is actually writable, saves revisions, and receives rubric feedback clearly labelled.
- NCEE mode matches **2026 source-dated** two-paper structure, without pretending to provide official exam questions.
- Parent sees Basic Science distinctly and can export/delete records.
- Without approved ZDR/under-13 gating, attempts to send child-entered text to an OpenAI endpoint are **blocked server-side** and the child gets functional reviewed/static lesson content.
- Rate limits/auth/isolation apply to all sensitive endpoints.
- Run `npm install`, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` if possible. Add missing scripts. Fix failures and report any blocked commands truthfully.

## 12. Delivery milestones and required output

Work in this priority order:
- **Milestone A:** inspect/refactor starter, create schema/seeds/source manifest/provenance model, session planner, reviewed deterministic question bank and two learner profiles; make local-first lessons work completely without an API key.
- **Milestone B:** diagnostic and mastery engine, help actions, mathematical verification, SVG non-verbal engine, English writing, adaptive scheduling and functional parent dashboard.
- **Milestone C:** secure parent auth and storage, reports/export/deletion, privacy gating for under-13 learners, legal/compliance documentation, server rate limits, safe optional AI provider integration behind disabled-by-default flag.
- **Milestone D:** responsive polished UI, accessibility, testing, deploy/run instructions and thorough README. Add school-specific entrance mapping only when officially verified and explicitly chosen.

At completion return: (1) what works live locally, (2) exact commands to run, (3) tests actually executed and results, (4) blockers such as ZDR, account credentials, new NERDC grade PDFs, (5) the next 3 concrete improvements. Keep `IMPLEMENTATION_STATUS.md` updated with proofs (file paths, commands, tests), not promises. **Do not ask follow-up questions before beginning implementation.**
