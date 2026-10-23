# Learning Coach Nigeria — Curriculum Source Integration Addendum

**Status:** Additional instructions to the previously supplied `CODEX_FULL_BUILD_PROMPT.md` and `AGENTS.md`.
**User settings:** Two independent profiles, Primary 2 and Primary 5; 20–30-minute sessions (25-minute default); target schools undecided; broad NECO Common Entrance and Lagos private-secondary entrance preparation; no school-provided scheme of work; use verified NERDC as the baseline.

## What changed

Five parent-provided source PDFs now supply week-by-week schemes, learning objectives and locally relevant topic sequencing. The application's curriculum engine must become **source-aware, auditable, deduplicated, grade/term/week addressable, and sensitive to the difference between NERDC curriculum content and supplementary learning material**. Do not treat the documents as a replacement for the existing primary-school tutor pedagogy specification. Keep all previously specified child-support pathways, English composition, six learning modules, parental progress reporting, privacy controls, and acceptance tests.

## Uploaded input files — ask the developer to make these accessible locally

The PDFs below are **input documents**, not code, and should reside in a local `reference-pdfs/` folder excluded from the public repository by `.gitignore`. Preserve the originals and their filenames. Do not commit full PDFs, page facsimiles or substantial extracted verbatim text to a public Git repository unless rights are separately established.

1. `970605695-The-Complete-Scheme-of-Work-for-Pre-primary-Primary-Schools.pdf` — 985 pages. Pawills Consulting-branded compilation. Covers Primary 1–6 starting around PDF page 610, with Primary 2 around page 667, Primary 3 around page 742, Primary 5 around page 844 and Primary 6 around page 894. Most important *secondary planning* source for detailed week-by-week topics.
2. `978433855-Pre-primary-Primary-Schools-Nerdc-Scheme-2025.pdf` — 987 pages. Very similar in content to file 1, with added promotional/branding material. Do **not** count as independent confirmation or an official 2025 NERDC publication just because of the title/branding. Run document/page-level duplicate detection against file 1 and keep page-specific provenance if any genuine differences remain.
3. `730125829-y75XyadLS3uMzHi6bEyk-Scheme-of-Work-for-Nursery-and-Primary-School-in-Nigeria-Pdfpdf.pdf` — 21 pages. Primarily an older sales/information page containing a sample detailed Primary 3 Mathematics scheme. **Not** a complete Primary 1–6 scheme; use only for cross-checking sample topics/objectives and teaching strategies.
4. `915968705-Unified-Schemes-of-Work-for-Primary-1-3.pdf` — 12 pages. A short scanned/partial extract with Lagos State Ministry of Education 2021 title pages, contents and the beginning of Primary 1 English. The table of contents describes a much longer work. **Do not** import missing Primary 2–3 chapters as though they were supplied. Seek the complete authenticated edition separately if available and legally accessible.
5. `537689481-Lagos-State-Scheme-of-Work-for-Primary-4-6-1-1.pdf` — 391 pages. Extensive older Lagos State Primary 4–6 scheme covering core subjects; preface references NERDC 2005. Useful for comparative topic coverage and teaching sequences for P5/P6, **not** proof of the current revised grade-level syllabus.

## Authoritative official references to verify

- NERDC new revised Basic Education Curriculum index, grade-specific Primary 1–6: https://www.nerdc.gov.ng/content_manager/new_curriculum_home.html
- NERDC September 8, 2025 official list of approved subject offerings: https://www.nerdc.org.ng/Doc/NERDC-approved-subjects-notice.pdf
- NECO National Common Entrance examination: https://neco.gov.ng/exams/ncee
- The previously supplied `CODEX_RESOURCE_MANIFEST.md` includes legacy NERDC detailed mathematics, English, basic science and other PDFs. Treat these as **legacy supporting references** where they differ from the 2025 revised curriculum.

Current revised subject structure relevant to this project, as listed by NERDC in September 2025:

- Primary 1–3: English Studies, Mathematics, Basic Science, Nigerian History, Social and Citizenship Studies, plus other officially listed subjects.
- Primary 4–6: English Studies, Mathematics, Basic Science and Technology, Basic Digital Literacy, Nigerian History, Social and Citizenship Studies, Pre-vocational Studies, plus other officially listed subjects.
- NERDC's notice describes phased implementation at the start of the 3-year cycle (Primary 1, Primary 4, JSS1 and SS1). **Do not infer** from that announcement alone that every school's P2/P5 sequence is identical or that every privately compiled PDF contains the final 2025 revision. Label unresolved implementation details for review.

## Source hierarchy and conflict resolution

1. **Official, verified, relevant revised NERDC grade/subject curriculum**: authoritative for learning outcomes.
2. **Authenticated Lagos State Ministry of Education scheme**: locally relevant planning support, where compatible with current NERDC outcomes.
3. **Privately authored comprehensive scheme**: candidate teaching sequence, subtopics and examples, not official certification.
4. **Historical Lagos / legacy NERDC sources**: gap-checking, prerequisite context and alternative examples, not current-status proof.
5. **Exam boards and individual schools' verified examination requirements**: authoritative only for the exam layer, not for the primary curriculum.
6. **AI-generated topic extensions or reasoning problems**: independently generated optional enrichments, with provenance `supplementary_original`.

When sources disagree, save all variants, prefer verified authoritative current learning outcomes, and flag conflicts for a parent/admin curriculum review queue. Never silently discard a documented learning objective or merge incompatible grade placements. Subject coverage is not "verified complete" until all official grade/subject outcomes have been manually or programmatically mapped and audited against their accessible source pages.

## New implementation requirements — complete these alongside the existing build prompt

### A. Document ingestion and crosswalk

- Add a developer-only import tool (e.g. a Python PyMuPDF script or equivalent) that reads locally supplied PDFs. Do not upload entire PDFs to the deployed application or call a generative model on every lesson request to parse PDFs.
- Start with deterministic, section-aware extraction and manually inspect malformed tables/scan text; OCR only where no usable text layer exists. Preserve original PDF page numbers and any distinct printed-page numbers.
- Extract: grade, official subject, app module, term, week, theme, topic, subtopic, stated learning objective, suggested activity, source ID, page number, publication year/edition, authority classification, confidence, review status.
- Normalise names (e.g. `English Studies` -> app module `English`; `Basic Science and Technology` -> `General Paper > Science`, plus technology as appropriate), **without losing original subject names**.
- Detect near-duplicates across the 985/987-page compilations by normalised page/text similarity. Never multiply curriculum coverage or topic mastery counts merely because the same lesson appears in two PDFs.
- Track topic prerequisites, next concepts, P1–P6 progression, term/week placement and which children are eligible for each topic.
- Where the 2021 Lagos P1–3 extract or older P4–6 Lagos scheme lacks a topic or grade, record `not present in this source` rather than inventing provenance.
- Include a provenance report: `docs/CURRICULUM_SOURCE_AUDIT.md`, with source coverage and unresolved conflicts.

### B. Curriculum database structure

Persist at least:

- `CurriculumSource`: `id`, `title`, `filename`, `publisher_claim`, `authority_tier`, `publication_date_or_claimed_edition`, `verified_official_url`, `rights_status`, `file_hash`, `review_status`.
- `CurriculumOutcome`: `id`, `grade`, `original_subject_name`, `module`, `domain`, `strand`, `topic`, `subtopic`, `objective`, `current_status` (`confirmed_current`, `legacy_reference`, `supplementary`, `needs_review`), `source_page`, `source_id`.
- `LearningSequence`: `outcome_id`, `term`, `week`, `suggested_duration`, `prerequisite_ids`, `enrichment_ids`.
- `CurriculumConflict`: `outcome_ids`, `conflict_type`, `sources`, `proposed_resolution`, `status`, `reviewer`.
- `LearnerProgress`: `learner_id`, `outcome_id`, `attempts`, `independent_success`, `assisted_success`, `misconceptions`, `last_reviewed_at`, `next_review_due`, `mastery_state`.

Keep the existing question bank, composition submissions, sessions, exam profiles, parental controls and privacy-safe tutoring infrastructure from the main build prompt.

### C. Actual learning behaviour

- **Primary 2**: core Primary 2, use Primary 1 for gaps, offer Primary 3 enrichment. Do not skip P2 outcomes just because the child has solved a few P3 puzzles.
- **Primary 5**: core Primary 5, use Primary 4 for gaps, introduce Primary 6 and broad entrance exam questions when ready.
- **20–30 minutes per session**, 25 minutes as default. Example 25-minute structure: 3-minute recall, 5-minute mini-lesson, 8-minute guided practice, 6-minute independent practice, 3-minute feedback/revision plan. Adjust to learner and subject; do not rigidly end a lesson in mid-explanation.
- Teach one question at a time, work with children's actual reasoning, and provide visible `I haven't learnt this`, `I've forgotten`, `Give me a hint`, `Explain another way` options.
- For `I haven't learnt this`, teach from prerequisite and first principles. For `I've forgotten`, give a short retrieval cue and worked refresher. A correct answer after help is **assisted progress**, not independent mastery. Retest a parallel problem independently.
- Regularly provide original reading passages, actual typed composition tasks with revision feedback, Maths working, short science explanations and question diagrams.
- Maintain separate modules for **English, Mathematics, Verbal Reasoning, Quantitative Reasoning, General Paper (Basic Science separately tracked), and Non-Verbal Reasoning**. Verbal, quantitative and non-verbal reasoning may be **exam enrichment** rather than subjects independently listed on the official NERDC core curriculum; make this explicit.
- Match exam formats only to verified NECO or school-specific information; avoid claiming one universal private-school entrance examination syllabus.

### D. Validation and safeguarding

- A private scheme of work can contain outdated or incorrect statements. Run factual, mathematical, literacy, age-appropriateness and pedagogical checks before surfacing content to children. Example: a suggestion that different parts of the tongue detect different specific tastes should **not** be reproduced as scientific fact.
- Maintain original source links and pages in the parent/admin interface, not children-facing screens.
- Store children's performance separately, collect minimal personal data, and follow documented under-13 protections. Keep an external AI pathway disabled until applicable approvals/technical controls are established.
- Do not bundle copyrighted source PDFs or substantial verbatim lesson tables publicly. Prefer structured topic names and original explanations/questions; verify permissions before broad reproduction or distribution.
- All practice questions, reading passages and reasoning diagrams generated for the tutor should be original unless licensed source questions are explicitly imported.

### E. Acceptance tests specific to these PDFs

1. P2 Mathematics week-level scheme is ingested from the comprehensive PDF (around PDF page 674), not mistakenly treated as NERDC-direct.
2. P2 Basic Science topics (around PDF page 680) are available and scientifically checked before use.
3. P3 Mathematics enrichment is linked to P2 prerequisite skills (around PDF page 746).
4. P5 Mathematics core scheme (around PDF page 848) and P6 challenging work (around PDF page 901) are visible in the distinct correct grade bands.
5. P5/P6 Science includes traceable topics and optional historical Lagos comparisons.
6. Importing the 987-page branded compilation does not double the count of topics already imported from the 985-page compilation.
7. The 12-page Lagos P1–3 excerpt does not falsely produce a complete P2 or P3 local-scheme mapping.
8. Unverified 2025 claims are never displayed as `official NERDC approved` solely based on PDF covers.
9. When a topic has conflicting placements or objectives across sources, an admin conflict record appears.
10. The parent sees three different progress measures: curriculum coverage, assessed independent mastery, and assisted learning progress.
11. P2 and P5 learner histories and scores remain isolated.
12. Reasoning exercises and entrance materials are labelled as entrance enrichment and are not counted as current NERDC curriculum completion.

## Outputs expected from Codex

1. Updated source-ingestion scripts and database migrations.
2. A reproducible, reviewed curriculum import with no duplicate inflation.
3. `docs/CURRICULUM_SOURCE_AUDIT.md` (sources, PDF pages, confidence, conflicts and gaps).
4. `docs/CURRICULUM_COVERAGE_MATRIX.md` (P1–P6 x subjects x outcomes, verified vs unverified).
5. Learning-path UI and an editable parent-facing curriculum map.
6. Implemented and tested adaptive lessons for P2 and P5, including "not taught" and "forgotten" flows.
7. Updated tests, screenshots/test results and `IMPLEMENTATION_STATUS.md` describing what works and what is not yet verified.

## Kickoff command to give Codex with these PDFs

> Read `AGENTS.md`, `docs/CODEX_FULL_BUILD_PROMPT.md`, and `CODEX_SCHEME_OF_WORK_ADDENDUM.md`. Integrate all five uploaded PDFs as a **local, private curriculum-reference corpus**, following the source hierarchy and deduplication rules in the addendum. Start by auditing the sources, checking duplicate content and producing a curriculum coverage/crosswalk report for Primary 1–6. Then implement the revised database, topic sequencing and adaptive tutoring paths for the Primary 2 and Primary 5 children. Keep the existing app and progress data intact. Do not represent the privately compiled "2025 NERDC" PDF as an authenticated official curriculum. Build working functionality, run tests and document unresolved source conflicts and access limitations.
