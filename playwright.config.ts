import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { existsSync } from "node:fs";
process.env.TEST_BOOTSTRAP =
  process.env.TEST_BOOTSTRAP || randomBytes(24).toString("hex");
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 45000,
  use: {
    launchOptions: existsSync("/usr/bin/chromium")
      ? { executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] }
      : undefined,
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      process.env.COACH_E2E_PRODUCTION === "true"
        ? "npm run start -- --port 3100"
        : "npm run dev -- --port 3100",
    url: "http://127.0.0.1:3100/api/state",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      COACH_DATA_DIR: path.join("/tmp", `learning-coach-e2e-${process.pid}`),
      PARENT_SETUP_CODE: process.env.TEST_BOOTSTRAP,
      APP_ORIGIN: "http://127.0.0.1:3100",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
