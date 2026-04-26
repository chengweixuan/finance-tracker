import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite, { schema });

async function reset() {
  console.log("Resetting database...");

  await db.run(sql`DELETE FROM net_worth_snapshots`);
  await db.run(sql`DELETE FROM transactions`);
  await db.run(sql`DELETE FROM investments`);
  await db.run(sql`DELETE FROM accounts`);

  // Reset autoincrement counters
  await db.run(sql`DELETE FROM sqlite_sequence`);

  console.log("All data cleared. Schema preserved.");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
