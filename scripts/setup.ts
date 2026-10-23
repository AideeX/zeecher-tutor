import { db, dataDir } from "../lib/db";
db();
console.log(
  `Database and curriculum prepared in ${dataDir()}. If this is a new family, the one-time setup code is in ${dataDir()}/setup-code. Enter it privately in the setup screen; do not commit it.`,
);
