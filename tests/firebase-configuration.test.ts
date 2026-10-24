import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inspectFirebaseConfiguration,
  FirebaseConfigurationError,
  type Environment,
} from "../lib/firebase/configuration";
const publicConfig = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "public-test-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-zeecher.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-zeecher",
  NEXT_PUBLIC_FIREBASE_APP_ID: "test-app-id",
  FIREBASE_PROJECT_ID: "demo-zeecher",
};
const emulator = {
  ...publicConfig,
  NODE_ENV: "test",
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
};
test("missing Firebase settings leave Phase 1 unconfigured and unable to connect", () => {
  const s = inspectFirebaseConfiguration({});
  assert.equal(s.status, "not-configured");
  assert.equal(s.canConnect, false);
  assert.equal(s.locationApproval, "pending");
});
test("a local emulator plan is validated but never started by inspection", () => {
  const s = inspectFirebaseConfiguration(emulator);
  assert.equal(s.status, "configuration-present-not-connected");
  assert.equal(s.canConnect, false);
  assert.ok(s.server);
  assert.equal(s.server.credentialMode, "emulator");
});
test("production rejects emulator settings including a client-only emulator flag", () => {
  assert.throws(
    () => inspectFirebaseConfiguration({ ...emulator, NODE_ENV: "production" }),
    FirebaseConfigurationError,
  );
  assert.throws(
    () =>
      inspectFirebaseConfiguration({
        NODE_ENV: "production",
        NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
      }),
    FirebaseConfigurationError,
  );
});
test("emulator plan rejects non-loopback endpoints, real project IDs and missing client opt-in", () => {
  for (const patch of [
    { FIRESTORE_EMULATOR_HOST: "remote.example:8080" },
    { FIREBASE_AUTH_EMULATOR_HOST: "" },
    { NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "false" },
    {
      FIREBASE_PROJECT_ID: "real-project",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "real-project",
    },
  ])
    assert.throws(
      () => inspectFirebaseConfiguration({ ...emulator, ...patch }),
      FirebaseConfigurationError,
    );
});
test("mismatched Firebase web/server projects and incomplete settings fail closed", () => {
  assert.throws(
    () =>
      inspectFirebaseConfiguration({
        ...emulator,
        FIREBASE_PROJECT_ID: "demo-other",
      }),
    FirebaseConfigurationError,
  );
  assert.throws(
    () => inspectFirebaseConfiguration({ FIREBASE_PROJECT_ID: "demo-zeecher" }),
    FirebaseConfigurationError,
  );
});
test("credential errors name fields without reflecting private values", () => {
  const secret = "test-private-value-never-returned";
  const env: Environment = {
    ...publicConfig,
    FIREBASE_ADMIN_CREDENTIAL_MODE: "service-account",
    FIREBASE_CLIENT_EMAIL: "operator@example.invalid",
    FIREBASE_PRIVATE_KEY: secret,
  };
  const result = inspectFirebaseConfiguration(env);
  assert.equal(result.canConnect, false);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.throws(
    () =>
      inspectFirebaseConfiguration({
        ...env,
        NEXT_PUBLIC_FIREBASE_PRIVATE_KEY: secret,
      }),
    (error: unknown) =>
      error instanceof FirebaseConfigurationError &&
      !error.message.includes(secret),
  );
});
test("workload identity plan requires explicit federation settings and stays disconnected", () => {
  assert.throws(
    () => inspectFirebaseConfiguration(publicConfig),
    FirebaseConfigurationError,
  );
  const result = inspectFirebaseConfiguration({
    ...publicConfig,
    GCP_PROJECT_NUMBER: "123456789",
    GCP_WORKLOAD_IDENTITY_POOL_ID: "test-pool",
    GCP_WORKLOAD_IDENTITY_PROVIDER_ID: "test-provider",
    GCP_SERVICE_ACCOUNT_EMAIL: "runtime@example.invalid",
  });
  assert.equal(result.canConnect, false);
  assert.ok(result.server);
  assert.equal(result.server.credentialMode, "workload-identity");
});
