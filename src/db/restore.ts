import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { sql } from "drizzle-orm";
import { existsSync } from "fs";

const BACKUP_PATH = "sqlite.db.backup";

if (!existsSync(BACKUP_PATH)) {
  console.error("No backup found at", BACKUP_PATH);
  process.exit(1);
}

const sqlite = new Database("sqlite.db");
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite, { schema });

const backupSqlite = new Database(BACKUP_PATH, { readonly: true });

function restore() {
  console.log("Restoring from backup...");

  // Clear current data
  sqlite.exec("DELETE FROM investment_history");
  sqlite.exec("DELETE FROM net_worth_snapshots");
  sqlite.exec("DELETE FROM transactions");
  sqlite.exec("DELETE FROM investments");
  sqlite.exec("DELETE FROM accounts");
  sqlite.exec("DELETE FROM sqlite_sequence");

  // Copy each table from backup
  const tables = ["accounts", "transactions", "investments", "investment_history", "net_worth_snapshots"];

  for (const table of tables) {
    const rows = backupSqlite.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0] as Record<string, unknown>);
    const placeholders = columns.map(() => "?").join(", ");
    const insert = sqlite.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`);

    const insertMany = sqlite.transaction((rows: Record<string, unknown>[]) => {
      for (const row of rows) {
        insert.run(...columns.map((c) => row[c]));
      }
    });

    insertMany(rows as Record<string, unknown>[]);
    console.log(`  Restored ${rows.length} rows in ${table}`);
  }

  sqlite.pragma("wal_checkpoint(TRUNCATE)");
  backupSqlite.close();

  console.log("Restore complete!");
  process.exit(0);
}

restore();
