import "server-only";
import { inspectFirebaseConfiguration } from "./configuration";

/** Phase 1 diagnostics only. No SDK is imported, no Firestore database is opened,
 * no Firebase Auth user is created, and no current API calls this module.
 * SDK initialization and real token verification are explicitly Phase 2 work.
 */
export function getFirebaseFoundationStatus() {
  return {
    activeApplicationStorage: "legacy-sqlite" as const,
    childToAiRequests: "disabled" as const,
    configuration: inspectFirebaseConfiguration(process.env),
  };
}
