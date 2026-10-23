import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import {
  mkdirSync,
  readFileSync,
  existsSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { skills } from "./content";
import audit from "../data/source-audit.json";
let connection: DatabaseSync | undefined;
export const dataDir = () =>
  path.resolve(
    process.env.COACH_DATA_DIR || path.join(process.cwd(), ".local"),
  );
export function db() {
  if (connection) return connection;
  mkdirSync(dataDir(), { recursive: true, mode: 0o700 });
  connection = new DatabaseSync(path.join(dataDir(), "coach.sqlite"));
  connection.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON;",
  );
  connection.exec("BEGIN IMMEDIATE");
  try {
    const version = connection.prepare("PRAGMA user_version").get() as {
      user_version: number;
    };
    if (version.user_version < 1)
      connection.exec(
        readFileSync(
          path.join(process.cwd(), "migrations/001_initial.sql"),
          "utf8",
        ),
      );
    if (version.user_version < 2)
      connection.exec(
        readFileSync(
          path.join(process.cwd(), "migrations/002_learning_evidence.sql"),
          "utf8",
        ),
      );
    chmodSync(path.join(dataDir(), "coach.sqlite"), 0o600);
    const put = connection.prepare(
      "INSERT OR IGNORE INTO curriculum_outcome(id,metadata) VALUES (?,?)",
    );
    for (const skill of skills) {
      put.run(skill.id, JSON.stringify(skill));
      connection
        .prepare("INSERT OR IGNORE INTO learning_sequence VALUES (?,?,?,?)")
        .run(
          skill.id,
          skill.term,
          skill.week,
          JSON.stringify(skill.prerequisiteIds),
        );
    }
    for (const source of audit.sources)
      connection
        .prepare("INSERT OR IGNORE INTO curriculum_source VALUES (?,?)")
        .run(
          source.id,
          JSON.stringify({
            ...source,
            verified_official_url: null,
            publication_date_or_claimed_edition:
              source.id === "978433855" ? "2025 claimed, unverified" : null,
            publisher_claim:
              source.id === "970605695" ? "Pawills Consulting" : null,
          }),
        );
    const conflicts = [
      {
        id: "historical-algebra",
        type: "factual_error",
        sources: [{ id: "537689481", page: 201 }],
        description:
          "A historical worked linear equation contains an incorrect result.",
        resolution:
          "Do not import worked answers. Original arithmetic uses deterministic keys.",
      },
      {
        id: "historical-placement",
        type: "placement_uncertain",
        sources: [
          { id: "537689481", page: 16 },
          { id: "970605695", page: 853 },
        ],
        description:
          "Historical Lagos pages contain mixed grade boundaries and a different science sequence from the private compilation.",
        resolution:
          "Keep both planning variants. Mixed-grade rows have unknown placement pending review; do not merge them into approved outcomes.",
      },
      {
        id: "taste-map",
        type: "factual_error",
        sources: [{ id: "970605695", page: 680 }],
        description:
          "Source suggests fixed tongue areas for different tastes. Do not teach this claim.",
        resolution:
          "Original child lesson excludes taste-map content. Parent/science review remains required.",
      },
      {
        id: "branding-2025",
        type: "authority_claim",
        sources: [{ id: "978433855", page: 1 }],
        description:
          "A branded 2025 cover does not establish official NERDC approval.",
        resolution:
          "Treat as a private compilation; near-duplicates do not add coverage.",
      },
      {
        id: "partial-lagos",
        type: "missing_source",
        sources: [{ id: "915968705", page: 1 }],
        description: "The 12-page excerpt has no supplied P2/P3 chapters.",
        resolution: "P2/P3 local mapping: not present in this source.",
      },
    ];
    for (const conflict of conflicts)
      connection
        .prepare(
          "INSERT OR IGNORE INTO curriculum_conflict(id,metadata) VALUES (?,?)",
        )
        .run(conflict.id, JSON.stringify(conflict));
    const codePath = path.join(dataDir(), "setup-code");
    if (
      !connection.prepare("SELECT id FROM parent LIMIT 1").get() &&
      !existsSync(codePath) &&
      !process.env.PARENT_SETUP_CODE
    )
      writeFileSync(codePath, randomBytes(24).toString("hex"), { mode: 0o600 });
    connection.exec("COMMIT");
    return connection;
  } catch (error) {
    connection.exec("ROLLBACK");
    connection.close();
    connection = undefined;
    throw error;
  }
}
export function one<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return db()
    .prepare(sql)
    .get(...params) as T | undefined;
}
export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return db()
    .prepare(sql)
    .all(...params) as T[];
}
export function run(sql: string, ...params: SQLInputValue[]) {
  return db()
    .prepare(sql)
    .run(...params);
}
export function transaction<T>(fn: () => T): T {
  db().exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    db().exec("COMMIT");
    return r;
  } catch (e) {
    db().exec("ROLLBACK");
    throw e;
  }
}
export function logAudit(parentId: string, action: string, metadata: unknown) {
  run(
    "INSERT INTO audit_event VALUES (?,?,?,?,?)",
    randomUUID(),
    parentId,
    action,
    JSON.stringify(metadata),
    Date.now(),
  );
}
export const defaultSettings = (grade: number) => ({
  minutes: 25,
  stretch: false,
  exam: false,
  quietHours: false,
  weekdays: [1, 2, 3, 4, 5],
  entrancePath: "broad",
  grade,
});
export function rotateSetupCode() {
  writeFileSync(
    path.join(dataDir(), "setup-code"),
    randomBytes(24).toString("hex"),
    { mode: 0o600 },
  );
}
export function setupCode() {
  db();
  return (
    process.env.PARENT_SETUP_CODE ||
    readFileSync(path.join(dataDir(), "setup-code"), "utf8").trim()
  );
}
