# Curriculum source audit

Reviewed in this cloud machine on **23 October 2026**. All page references below are one-based PDF pages. Private source files remain ignored and are not deployed. This audit is a planning and ingestion report, not a claim of full revised-curriculum coverage.

## Supplied corpus

| Source | Pages | Extracted unique candidate rows | Classification | SHA-256 |
|---|---:|---:|---|---|
| `970605695-The-Complete-Scheme-of-Work-for-Pre-primary-Primary-Schools.pdf` | 985 | 2387 | private_compilation | `e3568583940a51198c4ecedd88d56de107e979d2db925b3682ea2350a305c26c` |
| `537689481-Lagos-State-Scheme-of-Work-for-Primary-4-6-1-1.pdf` | 391 | 1427 | historical_lagos | `5290799cc5e7faa49c3aaea8e9e50124a3b98fbe6ba145adbbf14669234a8359` |
| `730125829-y75XyadLS3uMzHi6bEyk-Scheme-of-Work-for-Nursery-and-Primary-School-in-Nigeria-Pdfpdf.pdf` | 21 | 0 | sales_sample | `687b2f1a8557cf98006a9a7e85e496aabd9f0c25a6082f3fe7d969746acd1489` |
| `915968705-Unified-Schemes-of-Work-for-Primary-1-3.pdf` | 12 | 0 | partial_unverified_lagos | `5e1a5bc974dd6ba51da62064858b2bc14beef5b82970bdde6816c1f1a89fcdad` |
| `978433855-Pre-primary-Primary-Schools-Nerdc-Scheme-2025.pdf` | 987 | 366 | private_compilation | `835b7ee260d400ba9ee5f92aa0e84e70253d9f2e147373b6aa72c004e38d9116` |

All five original PDFs were retained under `reference-pdfs/` with their supplied names. The 21-page sales/sample file and 12-page Lagos excerpt were inspected but do not have rows accepted by this parser. A zero extracted-row count is not evidence that the file has no useful text. The sample contains P3 maths material; the Lagos excerpt has no supplied P2/P3 chapters.

## Extraction and deduplication

- Deterministic PyMuPDF text extraction; OCR is attempted only on image pages with insufficient text. Every page has a private text hash and layout-review marker.
- Primary-grade candidates in the large compilations are restricted to their primary section, after page 600. Headings supply provisional grade, subject and term; week rows are candidates, not approved lessons. Continuation pages and malformed tables require review.
- Five-word shingle Jaccard similarity at **0.88** identifies **660** branded-compilation pages matching the 985-page source. Stable tie-breaking makes the canonical page selection repeatable.
- The remaining **366** extracted branded rows are quarantined variants. None enters the child lesson bank or increases curriculum/mastery counts. This does not claim that all remaining pages are substantively different.
- **11 exact duplicate candidate records** are removed before both JSON and SQLite output, preserving all distinct source/page variants. Both outputs now contain **4,180** unique records. A second import produced an identical full-audit SHA-256.
- **16 historical mixed-grade rows** have unknown grade placement rather than being assigned to a guessed grade. Other rows remain low confidence until layout and grade placement are reviewed.
- Private outputs: `.local/curriculum-audit.json` and `.local/curriculum-import.sqlite`. The app uses a separate database and 54 original teaching objectives. Extracted raw tables are never automatically child-facing.
- Objective/activity cells are retained in private candidate text, but structured `stated_learning_objective` and `suggested_activity` remain null where reliable cell separation is unresolved. Printed page numbers are kept only when a clear numbered footer exists.

## Verified spot checks in the private compilation

| Grade/domain | PDF page | Finding and treatment |
|---|---:|---|
| P2 Mathematics | 674 | Week-level whole-number, fractions and addition candidates extracted; original place-value lesson links here. Private planning support, not NERDC-direct. |
| P2 Basic Science | 680 | Senses candidates available; eye-care lesson uses original safe wording. Incorrect fixed-tongue-area teaching is excluded and queued for review. |
| P3 Mathematics | 746 | Distinct grade placement; original P3 numeration skill requires P2 numeration. |
| P5 Mathematics | 848 | Distinct P5 core mapping; no promotion to P6 merely for solving a puzzle. |
| P5 Science/Technology | 853 | Private-source P5 habitat/environment mapping; historical and legacy sequences are retained as alternatives. |
| P6 Mathematics | 901 | Separate P6 band, accessible to Challenger only after parent enablement and retained P5 evidence. |
| P6 Science/Technology | 907 | Distinct P6 solar-system mapping, not merged into P5. |

## Official-source checks

The current environment can retrieve the official index, subject notice, legacy mathematics/science PDFs, NECO notice and API guidance. Earlier proxy-denied observations were superseded by these new checks. HTTP 200 means retrieval succeeded; it does not mean every learning outcome has been audited.

| Reference | Result |
|---|---|
| [revised-index](https://nerdc.gov.ng/content_manager/new_curriculum_home.html) | HTTP 200; retrieved for review |
| [approved-subjects](https://www.nerdc.org.ng/Doc/NERDC-approved-subjects-notice.pdf) | HTTP 200; retrieved for review |
| [ncee](https://neco.gov.ng/exams/ncee) | HTTP 200; retrieved for review; landing page supplies an application shell, not detailed exam structure |
| [under18-policy](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) | HTTP 200; retrieved for review |
| [legacy-maths-p1-3](https://nerdc.gov.ng/content_manager/primary/pri1-3_maths.pdf) | HTTP 200; retrieved for review |
| [legacy-maths-p4-6](https://nerdc.gov.ng/content_manager/primary/pri4-6_maths.pdf) | HTTP 200; retrieved for review |
| [legacy-science-p1-3](https://nerdc.gov.ng/content_manager/primary/pri1-3_basic_science_technology.pdf) | HTTP 200; retrieved for review |
| [legacy-science-p4-6](https://nerdc.gov.ng/content_manager/primary/pri4-6_basic_science_technology.pdf) | HTTP 200; retrieved for review |
| [revised-p1](https://lmis.nerdcportals.com.ng/pry_1) | HTTP Error 403: Forbidden |
| [revised-p2](https://lmis.nerdcportals.com.ng/pry_2) | HTTP Error 403: Forbidden |
| [revised-p3](https://lmis.nerdcportals.com.ng/pry_3) | HTTP Error 404: Not Found |
| [revised-p4](https://lmis.nerdcportals.com.ng/pry_4) | HTTP Error 403: Forbidden |
| [revised-p5](https://lmis.nerdcportals.com.ng/pry_5) | HTTP Error 403: Forbidden |
| [revised-p6](https://lmis.nerdcportals.com.ng/pry_6) | HTTP Error 404: Not Found |
| [ncee-2026-notice](https://neco.gov.ng/2026%20NCEE%20ADVERT%20AND%20POSTER%20-%20GENERAL%20INFO.pdf) | HTTP 200; retrieved for review |

The NERDC notice dated 8 September 2025 explicitly lists English Studies, Mathematics and Basic Science for P1–3; and Basic Science and Technology, Basic Digital Literacy and Pre-vocational Studies among P4–6 subjects. It describes implementation at the start of three-year cycles. This does not establish identical P2/P5 sequencing in every school. The revised P2/P5 detail endpoints still return 403; revised P3/P6 return 404. No access controls were bypassed.

## Supporting legacy crosswalk (reviewed pages, not current-completeness claims)

| App concept | Official legacy source | PDF page | Relationship |
|---|---|---:|---|
| P2 numeration/place value | `pri1-3_maths.pdf` | 13 | Direct supporting whole-number and tens/units content. |
| P2 senses/eye observation | `pri1-3_basic_science_technology.pdf` | 11 | Supporting senses content; science facts checked independently in original lessons. |
| P3 equivalent fractions | `pri1-3_maths.pdf` | 25 | Supporting equal-value fraction outcome; app questions are original. |
| P5 large numbers | `pri4-6_maths.pdf` | 22 | Partial support for thousands/millions; not a complete P5 maths mapping. |
| P6 place value | `pri4-6_maths.pdf` | 44 | Supporting millions/billions and digit-value outcomes. |
| P5 environment | `pri4-6_basic_science_technology.pdf` | 17–18 | Pollution/waste coverage differs from the private source’s habitat sequence. Preserve both; do not claim the habitat lesson completes these legacy outcomes. |

These pages were inspected in the retrieved PDFs. URLs and hashes are in `data/official-source-checks.json`; full official PDFs remain private. These limited legacy checks are recorded here, not automatically promoted to `confirmed_current` app outcomes.

## Conflicts and outstanding review

The parent review queue records five concrete concerns: the tongue-map claim (private p680); a wrong algebra result (historical Lagos p201); mixed historical grade boundaries/different science sequences (historical p16 versus private p853); the branded 2025 authority claim; and absent P2/P3 chapters in the Lagos excerpt. Review notes are audited; marking a concern reviewed does not certify current curriculum coverage.

Still outstanding: manual row/cell review, complete official current grade/subject crosswalks, source publication/rights authentication, broader factual/age-level review, and lawful access to a complete authenticated Lagos P1–3 edition. Private PDFs and substantial extracted lesson tables are excluded from public Git and deployment bundles.
