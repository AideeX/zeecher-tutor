import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  existsSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const root = process.cwd();
function inventory(directory: string) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules/tsx/dist/cli.mjs"),
      path.join(root, "scripts/migration/inventory.ts"),
    ],
    {
      cwd: directory,
      env: { ...process.env, COACH_DATA_DIR: directory },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const folder = path.join(directory, ".local/migration");
  const file = path.join(folder, readdirSync(folder)[0]);
  return {
    result: JSON.parse(readFileSync(file, "utf8")),
    stdout: result.stdout,
    file,
  };
}
test("Phase 1 database inventory reads a fixture without altering or disclosing records", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "zeecher-inventory-"));
  try {
    const file = path.join(dir, "coach.sqlite");
    const db = new DatabaseSync(file);
    db.exec(
      "CREATE TABLE learner(id TEXT PRIMARY KEY,nickname TEXT); INSERT INTO learner VALUES ('fixture-id','PRIVATE_FIXTURE_NICKNAME'); PRAGMA user_version=2;",
    );
    db.close();
    const before = createHash("sha256")
      .update(readFileSync(file))
      .digest("hex");
    const captured = inventory(dir);
    assert.equal(
      createHash("sha256").update(readFileSync(file)).digest("hex"),
      before,
    );
    assert.equal(captured.result.schemaVersion, 2);
    assert.equal(captured.result.counts.learner, 1);
    assert.equal(captured.result.containsRecordContents, false);
    assert.equal(captured.result.foreignKeyViolations, 0);
    assert.equal(captured.stdout.includes("PRIVATE_FIXTURE_NICKNAME"), false);
    assert.equal(
      readFileSync(captured.file, "utf8").includes("PRIVATE_FIXTURE_NICKNAME"),
      false,
    );
    assert.equal(statSync(captured.file).mode & 0o777, 0o600);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("Phase 1 inventory does not create a missing application database", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "zeecher-no-db-"));
  try {
    const captured = inventory(dir);
    assert.equal(captured.result.status, "no-legacy-database");
    assert.equal(existsSync(path.join(dir, "coach.sqlite")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
