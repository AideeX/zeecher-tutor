# Acceptance scenarios and evidence

Automated checks live in tests/engine.test.ts, tests/persistence.test.ts, tests/test_curriculum.py and e2e/coach.spec.ts. Browser tests create an isolated temporary family and delete it.

| Scenario | Evidence |
|---|---|
| Parent setup, hashed-password login, parent locking on child launch | Browser family flow; lib/security.ts |
| Sibling attempts/writing isolated; cross-learner lesson access denied | Browser family and ownership flows |
| P2 entrance denied; P5 parent-gated; next-grade readiness enforced | Browser ownership flow; engine progression test |
| Not-taught help, prerequisite explanation and assisted progress | Browser family flow |
| Forgotten and alternate explanations | Browser ownership flow |
| Independent versus assisted/repeated/retained evidence | Engine mastery tests |
| Equivalent fractions and invalid numeric forms | Engine equivalence test |
| Deterministic keyed questions and SVG rotations | Engine bank check; browser SVG selection |
| Writing saves revisions with clearly provisional rubric checklist | Browser family flow; engine writing test |
| Six-question diagnostic, stale-answer rejection, cross-skill recap support | Browser diagnostic flow; API source |
| Parent exports, learner purge and full family deletion | Browser family/deletion flows |
| Child-to-AI endpoint disabled | Browser family flow; server endpoint remains blocked |
| Parent/learner page semantics and text contrast | Axe WCAG A/AA scans embedded in browser test |
| Mobile has no horizontal overflow | Browser 390 px viewport check |
| Data/migrations persist across processes without duplicate seeding | Persistence test |
| Private source pages/grade bands traceable; branded variants quarantined | Python corpus tests |
| Exact duplicate candidate records consistent across JSON/SQLite | Python deduplication and corpus tests |

These checks validate a local implementation, not exhaustive curriculum accuracy, full accessibility certification, legal compliance, complete NCEE papers or a production security audit. Manual curriculum/age-level review and broader content are still needed. See IMPLEMENTATION_STATUS.md for exact run results.
