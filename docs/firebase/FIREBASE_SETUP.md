# Beginner setup guide — use at the Phase 2 checkpoint

**No Firebase or Vercel configuration is needed to finish Phase 1. Do not create a database or enter credentials yet.** The existing app still uses SQLite. The following steps are a checklist for the next approved phase, not steps that have already been executed.

## 1. Approve a location first

Read REGION_AND_RETENTION.md. The proposed Firestore location is Johannesburg (`africa-south1`), with Belgium as the comparison alternative. Tell the developer which location you approve. Until then, do not click Create database in Firebase.

## 2. Create a development project when Phase 2 asks

1. Sign in at https://console.firebase.google.com/ with your own Google account.
2. Choose Create/Add project and give it a recognizable development name, such as Zeecher Tutor Development.
3. Keep Google Analytics disabled initially; it is not needed for this migration.
4. Record the project ID shown in Project settings. This identifier is not a private key.
5. Keep development and production separate. Do not put real child data in the development project.

Creating a project is not the same as approving/creating a Firestore database. Stop before database creation until the location decision is confirmed.

## 3. Configure parent authentication

1. Open Build -> Authentication and choose Get started if shown.
2. Under Sign-in method, enable Email/Password only.
3. Leave Google, phone, anonymous child sign-in and other providers disabled initially.
4. Configure email verification and password reset templates with the application name.
5. Add only the exact approved staging/production domains under authorized domains; do not broadly trust arbitrary Vercel preview domains.
6. The implementation must restrict action/continue URLs and family provisioning server-side. Firebase authorized domains and a hidden signup button do not enforce invitation-only membership.

Use fresh parent registration. We will not import old password hashes. Existing learning records will be mapped to a verified adult UID before migration.

## 4. Create Firestore only after explicit location approval

1. Open Build -> Firestore Database -> Create database.
2. Choose the standard native Firestore option appropriate to the SDK implementation.
3. Select the **approved** location exactly. Stop if it differs from the agreed location.
4. Start with locked/production access, never an open test-mode rule.
5. The version-controlled rules and indexes will be tested and deployed in a later approved phase. Phase 1's files are drafts, not deployed rules.

Do not enable paid backup/jobs/features without reviewing billing. Budgets can alert you; they do not automatically cap charges. No payment or billing configuration has been changed in Phase 1.

## 5. Register the web app and server identity

1. In Project settings -> General, register a Web app.
2. Copy only its ordinary web configuration into the matching future `NEXT_PUBLIC_FIREBASE_*` variables. Its API key is public configuration, not an Admin credential.
3. For server access, prefer Vercel OIDC with a dedicated Google service account and restricted Workload Identity Federation trust.
4. Do not grant the running app project Owner/Editor permissions. Use the Firestore and Firebase Auth permissions actually required; keep migration/deletion identities appropriately separate.
5. Do not download a service-account JSON key now. If keyless integration cannot be used, a reviewed server-only fallback will be explained at that checkpoint.

No Admin SDK is initialized in Phase 1. Configuration inspection does not authenticate credentials or create a connection.

## 6. Establish your platform-administrator identity

After the Phase 2 authentication/bootstrap screen exists, verify your parent email and obtain its Firebase Auth UID from Authentication -> Users. That UID will be configured server-side as `ZEECHER_PLATFORM_ADMIN_UID`. Do not use a browser-supplied flag or email address as proof of administrator authority.

The administrator can control invitations. This role does not automatically authorize reading other families' child writing or progress. Initial enrolment, including your own family, must be explicitly bootstrapped/invited and audited; no public first-account-wins endpoint will be retained after cutover.

## 7. Enter environment settings when the implementation is ready

In the Vercel project, open Settings -> Environment Variables. Use separate Development/Preview/Production settings and Firebase projects. Enter secrets directly in the platform; **do not paste passwords, setup codes or private keys into chat or GitHub**.

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public Firebase web app configuration |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Exact Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app's project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app ID |
| `FIREBASE_PROJECT_ID` | Matching server project ID |
| `FIRESTORE_DATABASE_ID` | Usually `(default)`; only change deliberately |
| `FIREBASE_ADMIN_CREDENTIAL_MODE` | Prefer `workload-identity`; fallback `service-account` only if reviewed |
| `GCP_PROJECT_NUMBER` | Federation target project number |
| `GCP_WORKLOAD_IDENTITY_POOL_ID` | Federation pool identifier |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_ID` | Federation provider identifier |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Dedicated runtime identity |
| `ZEECHER_PLATFORM_ADMIN_UID` | Your verified adult administrator UID, server-only |
| `RATE_LIMIT_HMAC_SECRET` | Private random secret for privacy-preserving abuse-control keys; not implemented yet |
| `APP_ORIGIN` | Exact HTTPS origin for that deployment environment |
| `UNDER13_AI_ENABLED` | Keep `false` |
| `NEXT_TELEMETRY_DISABLED` | Optional `1` |

Private-key fallback uses server-only `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`, not NEXT_PUBLIC variables. The ordinary public API key does not grant database authorization.

Local emulator settings are development-only and use a `demo-*` project, both loopback hosts and the client emulator flag. Never configure emulator hosts or debug bypasses in production. SDK/CLI installation and real emulator integration tests are Phase 2 work; no emulator has been started in Phase 1.

The eventual Firestore application will not use `COACH_DATA_DIR` or `PARENT_SETUP_CODE` in hosted requests. Those settings still apply to the current SQLite app until cutover. Secure production cookies will be mandatory in the new authentication implementation. Do not deploy this transitional SQLite app publicly by merely adding Firebase variables.

## Stop before production

Only move forward after family-isolation tests, real Auth/emulator integration tests, rule tests, migration parity, privacy/retention decisions and a protected Vercel staging build have passed. No public deployment or real-child-data connection is authorized by completing Phase 1.
