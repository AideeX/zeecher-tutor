# Phase 1 foundation only

These are inactive contracts, pure guards, configuration inspection and a server-only diagnostic boundary. There is no Firebase SDK, adapter, network initialization, production backend selector or active API import. The app continues using `lib/db.ts` and `lib/security.ts`.

Read docs/firebase/PHASE_1.md and ARCHITECTURE.md before wiring anything. A typed `VerifiedParentIdentity` or context is not authentication: Phase 2 must obtain it through verified Firebase tokens, stored grants and live membership checks. Never construct it from a request body. The Admin SDK will bypass Firestore rules, so authorization cannot be delegated to those rules alone.
