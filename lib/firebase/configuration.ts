/** Pure configuration inspection. It never initializes an SDK or contacts Google. */
import { z } from "zod";
import { documentIdSchema } from "./domain";

export type Environment = Readonly<Record<string, string | undefined>>;
export class FirebaseConfigurationError extends Error {
  constructor(public readonly fields: readonly string[]) {
    super(`Check Firebase configuration fields: ${fields.join(", ")}.`);
    this.name = "FirebaseConfigurationError";
  }
}
const projectId = z.string().regex(/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/);
const hostname = z.string().regex(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i);
const webSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: hostname,
  projectId,
  appId: z.string().min(1),
});
function requireFields(env: Environment, fields: readonly string[]) {
  const missing = fields.filter((field) => !env[field]?.trim());
  if (missing.length) throw new FirebaseConfigurationError(missing);
}
function parse<T>(
  schema: z.ZodType<T>,
  value: unknown,
  names: readonly string[],
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new FirebaseConfigurationError(names);
  return parsed.data;
}
function localEmulatorHost(host: string | undefined): boolean {
  if (!host) return false;
  const match = host.match(/^(localhost|127\.0\.0\.1):(\d{1,5})$/);
  return !!match && Number(match[2]) > 0 && Number(match[2]) <= 65535;
}
export function inspectFirebaseConfiguration(env: Environment) {
  const leakedSecretNames = [
    "NEXT_PUBLIC_FIREBASE_PRIVATE_KEY",
    "NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_JSON",
    "NEXT_PUBLIC_RATE_LIMIT_HMAC_SECRET",
  ].filter((name) => env[name]);
  if (leakedSecretNames.length)
    throw new FirebaseConfigurationError(leakedSecretNames);
  const emulators = [
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIRESTORE_EMULATOR_HOST",
  ] as const;
  const usingEmulators =
    emulators.some((name) => !!env[name]) ||
    env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true";
  if (env.NODE_ENV === "production" && usingEmulators)
    throw new FirebaseConfigurationError([
      ...emulators,
      "NEXT_PUBLIC_FIREBASE_USE_EMULATORS",
    ]);
  if (!env.FIREBASE_PROJECT_ID && !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    if (usingEmulators)
      throw new FirebaseConfigurationError(["FIREBASE_PROJECT_ID"]);
    return {
      phase: 1 as const,
      status: "not-configured" as const,
      canConnect: false as const,
      locationApproval: "pending" as const,
    };
  }
  const publicNames = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ] as const;
  requireFields(env, [...publicNames, "FIREBASE_PROJECT_ID"]);
  const web = parse(
    webSchema,
    {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    publicNames,
  );
  if (web.projectId !== env.FIREBASE_PROJECT_ID)
    throw new FirebaseConfigurationError([
      "FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    ]);
  let credentialMode: "emulator" | "workload-identity" | "service-account";
  if (usingEmulators) {
    if (!web.projectId.startsWith("demo-"))
      throw new FirebaseConfigurationError(["FIREBASE_PROJECT_ID"]);
    if (!emulators.every((name) => localEmulatorHost(env[name])))
      throw new FirebaseConfigurationError(emulators);
    if (env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS !== "true")
      throw new FirebaseConfigurationError([
        "NEXT_PUBLIC_FIREBASE_USE_EMULATORS",
      ]);
    credentialMode = "emulator";
  } else {
    credentialMode =
      env.FIREBASE_ADMIN_CREDENTIAL_MODE === "service-account"
        ? "service-account"
        : "workload-identity";
    if (
      env.FIREBASE_ADMIN_CREDENTIAL_MODE &&
      !["workload-identity", "service-account"].includes(
        env.FIREBASE_ADMIN_CREDENTIAL_MODE,
      )
    )
      throw new FirebaseConfigurationError(["FIREBASE_ADMIN_CREDENTIAL_MODE"]);
    requireFields(
      env,
      credentialMode === "workload-identity"
        ? [
            "GCP_PROJECT_NUMBER",
            "GCP_WORKLOAD_IDENTITY_POOL_ID",
            "GCP_WORKLOAD_IDENTITY_PROVIDER_ID",
            "GCP_SERVICE_ACCOUNT_EMAIL",
          ]
        : ["FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"],
    );
  }
  if (env.ZEECHER_PLATFORM_ADMIN_UID)
    parse(documentIdSchema, env.ZEECHER_PLATFORM_ADMIN_UID, [
      "ZEECHER_PLATFORM_ADMIN_UID",
    ]);
  return {
    phase: 1 as const,
    status: "configuration-present-not-connected" as const,
    canConnect: false as const,
    locationApproval: "pending" as const,
    web,
    server: {
      projectId: web.projectId,
      databaseId: env.FIRESTORE_DATABASE_ID || "(default)",
      credentialMode,
    },
  };
}
