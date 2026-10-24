# Proposed location and retention — approval pending

Checked 24 October 2026. No Firestore database, Firebase project or Vercel region setting was created or changed by Phase 1.

## Location recommendation

Propose **Firestore regional `africa-south1` (Johannesburg)**, paired with the nearby **Vercel `cpt1` (Cape Town)** function region if supported by the selected Vercel plan. Both locations are listed in the providers' official documentation. This is a proposal, not an approved or configured location.

Reasons and limits:

- A regional database is a reasonable starting point for a small invited platform; do not assume the price or redundancy of a multi-region database is necessary. Compare actual read/write/index, storage, network, backup and recovery costs before enabling paid services.
- Keep API functions geographically close to Firestore to limit repeated server-to-database round trips. Cross-provider or cross-region traffic can still be billed.
- Johannesburg is not automatically fastest from Lagos. Internet routing can make a European route faster. Compare `africa-south1`/`cpt1` with **`europe-west1` (Belgium)** and an appropriate nearby European Vercel region using representative Lagos measurements before a final choice.
- Neither South Africa nor Belgium provides Nigerian data residency. Firestore location also does not establish where all Firebase Authentication, logging, support or backup processing occurs. Review applicable Nigerian data-protection requirements, parental consent, processor terms and cross-border safeguards; an African location is not automatic legal compliance.
- A Firestore database's location cannot be changed in place. Do not click Create database until the owner explicitly approves the location. A later change would require another database migration.

Recommendation: seek approval for Johannesburg first, subject to the latency/cost/privacy checks above. If those favour Europe, approve Belgium instead **before** creation. There is currently no latency benchmark from Nigerian users and no account-specific cost quote; do not present either as measured evidence.

References:
- https://firebase.google.com/docs/firestore/locations
- https://firebase.google.com/docs/firestore/pricing
- https://vercel.com/docs/regions

## Suggested retention policy — not enabled

| Data | Proposed default | Important condition |
|---|---|---|
| Detailed activity, raw answers and help/session detail | 90 days | Retain minimized assessment evidence separately; do not lose independent/assisted/repeated history |
| Writing drafts and revisions | 180 days | Parents may deliberately keep selected portfolio pieces longer; explain this clearly |
| Minimized evidence/progress and review schedules | While the family account is active | Offer export/delete at any time; review inactive accounts after 12 months and agree notice/deletion policy before automation |
| Security/admin audit metadata | 180 days | No writing, raw answers, passwords, tokens or unnecessary personal information |
| Parent session access | Up to 8 hours | Sensitive actions require recent reauthentication; revoke on child launch/logout |
| Child session access | Up to 2 hours | Revoke for profile removal, archive, family suspension or parent action |
| Invitations | 7 days, single use | Store token hashes, bind acceptance to verified adult email |
| Rate-limit identifiers | At most 24 hours unless a documented security need | Short-lived HMAC identifiers; do not keep raw IP histories |
| Backups | Rolling 30 days | Restricted access, managed encryption, restoration testing and disclosed deletion lag |
| Online record deletion | Revoke access immediately; target cleanup within 24 hours | Durable worker, retries and failure alerts; not an unverified legal guarantee |

These are proposals for owner approval before enforcement. **Nothing is expired or deleted in Phase 1.** Current records remain in SQLite. TTL must not be used as an authorization check, and deleting a Firestore parent document does not delete its descendants.

Do not place raw answer text and indispensable mastery evidence in the same TTL-deleted document. Evidence is still children's personal data, even when minimized; it remains family-restricted and is removed on applicable family/profile deletion. Explicitly saved writing portfolios must not prevent a parent from deleting all writing later.

Managed Firestore encryption protects storage and transport but is not end-to-end encryption against authorized servers/project administrators. Additional envelope encryption for writing can be assessed separately; do not claim it is already implemented. No child text is sent to an AI provider during migration.
