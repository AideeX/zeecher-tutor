import { writeFileSync } from "node:fs";
import { skills, question } from "../lib/content";
const rows = skills.map(
  ({
    lesson: _,
    example: __,
    alternate: ___,
    cue: ____,
    hint: _____,
    ...s
  }) => {
    void _;
    void __;
    void ___;
    void ____;
    void _____;
    return s;
  },
);
writeFileSync(
  "data/curriculum.json",
  JSON.stringify(
    { status: "original_small_teaching_map_not_exhaustive", skills: rows },
    null,
    2,
  ) + "\n",
);
const headers = [
  "id",
  "grade",
  "module",
  "domain",
  "topic",
  "objective",
  "sourceId",
  "sourcePage",
  "status",
];
writeFileSync(
  "docs/CURRICULUM_TOPIC_INVENTORY.csv",
  [
    headers.join(","),
    ...rows.map((s) =>
      headers
        .map(
          (k) =>
            '"' +
            String(s[k as keyof typeof s] ?? "").replaceAll('"', '""') +
            '"',
        )
        .join(","),
    ),
  ].join("\n") + "\n",
);
const ids = new Set(
  skills
    .filter((s) => s.domain !== "Composition")
    .flatMap((s) => Array.from({ length: 60 }, (_, i) => question(s, i).id)),
);
console.log(
  `${rows.length} original teaching objectives, ${ids.size} distinct assessment IDs. Inventory is provisional and not full curriculum coverage.`,
);
