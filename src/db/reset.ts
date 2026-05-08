import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

const sqlite = new Database("sqlite.db");
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite, { schema });

async function reset() {
  console.log("Resetting database...");

  await db.run(sql`DELETE FROM tax_config`);
  await db.run(sql`DELETE FROM budget_allocations`);
  await db.run(sql`DELETE FROM budget_config`);
  await db.run(sql`DELETE FROM investment_history`);
  await db.run(sql`DELETE FROM net_worth_snapshots`);
  await db.run(sql`DELETE FROM transactions`);
  await db.run(sql`DELETE FROM investments`);
  await db.run(sql`DELETE FROM accounts`);
  await db.run(sql`DELETE FROM sqlite_sequence`);

  sqlite.pragma("wal_checkpoint(TRUNCATE)");

  console.log("All data cleared.");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
