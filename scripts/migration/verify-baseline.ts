import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import baseline from "../../docs/firebase/PRESERVATION_BASELINE.json";

// Phase 1 acceptance check, not a claim that future refactors cannot change code.
// Foundation/configuration docs may change; active application behaviour must not.
const critical = Object.entries(baseline.files).filter(([file]) =>
  /^(app\/|components\/|lib\/|data\/|migrations\/|tests\/|scripts\/)/.test(
    file,
  ),
);
const changed = critical
  .filter(
    ([file, expected]) =>
      !existsSync(file) ||
      createHash("sha256").update(readFileSync(file)).digest("hex") !==
        expected,
  )
  .map(([file]) => file);
if (changed.length) {
  console.error("Active application baseline changed:", changed);
  process.exitCode = 1;
} else
  console.log(
    `Phase 1 preservation check passed: ${critical.length} existing application/data/test files unchanged.`,
  );
