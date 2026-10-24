/** Read-only legacy inventory. Private counts stay in an ignored local file.
 * This is NOT a backup, data export, Firebase connection, or migration.
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const dataDir = path.resolve(process.env.COACH_DATA_DIR || ".local");
const databasePath = path.join(dataDir, "coach.sqlite");
const outputDir = path.resolve(".local/migration");
mkdirSync(outputDir, { recursive: true, mode: 0o700 });
const output = path.join(outputDir, `phase-1-inventory-${randomUUID()}.json`);
let inventory: unknown = {
  status: "no-legacy-database",
  containsRecordContents: false,
};
if (existsSync(databasePath)) {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    database.exec("PRAGMA query_only=ON; BEGIN;");
    const names = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as { name: string }[];
    const counts = Object.fromEntries(
      names.map(({ name }) => {
        const safeName = '"' + name.replaceAll('"', '""') + '"';
        return [
          name,
          database.prepare(`SELECT COUNT(*) AS count FROM ${safeName}`).get()!
            .count,
        ];
      }),
    );
    const version = database.prepare("PRAGMA user_version").get()!.user_version;
    const foreignKeyViolations = database
      .prepare("PRAGMA foreign_key_check")
      .all().length;
    database.exec("COMMIT");
    inventory = {
      status: "inventoried-read-only",
      schemaVersion: version,
      counts,
      foreignKeyViolations,
      containsRecordContents: false,
    };
    if (foreignKeyViolations) process.exitCode = 1;
  } finally {
    database.close();
  }
}
writeFileSync(output, JSON.stringify(inventory, null, 2) + "\n", {
  mode: 0o600,
  flag: "wx",
});
console.log(
  `Private migration inventory saved to ${output}. No record contents or credentials were read/exported.`,
);
