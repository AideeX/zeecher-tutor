import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
test("SQLite migrations and family data survive a new process without reseeding duplicates", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "coach-persistence-"));
  const modulePath = path.join(process.cwd(), "lib/db.ts");
  const execute = (script: string) => {
    const r = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `import {one,run,db} from ${JSON.stringify(modulePath)}; ${script}`,
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, COACH_DATA_DIR: dir },
        encoding: "utf8",
      },
    );
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim());
  };
  try {
    const first = execute(
      "db();run('INSERT INTO parent VALUES (?,?,?,?)','fixture','fixture','test-only-hash',1); console.log(JSON.stringify(one('SELECT COUNT(*) AS n FROM curriculum_outcome')))",
    );
    const second = execute(
      "db();console.log(JSON.stringify({count:one('SELECT COUNT(*) AS n FROM curriculum_outcome').n,parent:one('SELECT id FROM parent').id,version:one('PRAGMA user_version').user_version}))",
    );
    assert.equal(second.count, first.n);
    assert.equal(second.parent, "fixture");
    assert.equal(second.version, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
