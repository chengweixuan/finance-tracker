import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("sqlite.db");
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite, { schema });

async function seedMock() {
  console.log("Seeding MOCK data (for development only)...");

  // Accounts
  const [main] = await db.insert(schema.accounts).values({ name: "Main Account", type: "bank", balance: 150000, currency: "SGD" }).returning();
  const [stash] = await db.insert(schema.accounts).values({ name: "Stash Account", type: "bank", balance: 10000, currency: "SGD" }).returning();
  const [brokerage] = await db.insert(schema.accounts).values({ name: "Brokerage", type: "brokerage", balance: 0, currency: "SGD" }).returning();
  const [crypto] = await db.insert(schema.accounts).values({ name: "Crypto Wallet", type: "crypto", balance: 3200, currency: "SGD" }).returning();

  console.log("  Created 4 accounts");

  // Transactions
  const txns = [
    { accountId: main.id, amount: 5500, type: "income" as const, category: "Salary", description: "Monthly salary", date: "2026-04-01" },
    { accountId: main.id, amount: 1800, type: "expense" as const, category: "Housing", description: "Rent payment", date: "2026-04-01" },
    { accountId: main.id, amount: 320, type: "expense" as const, category: "Food", description: "Groceries", date: "2026-04-05" },
    { accountId: main.id, amount: 85, type: "expense" as const, category: "Utilities", description: "Electric bill", date: "2026-04-07" },
    { accountId: main.id, amount: 150, type: "expense" as const, category: "Transport", description: "Gas and parking", date: "2026-04-10" },
    { accountId: main.id, amount: 200, type: "expense" as const, category: "Entertainment", description: "Concert tickets", date: "2026-04-12" },
    { accountId: stash.id, amount: 45.50, type: "income" as const, category: "Interest", description: "Monthly interest", date: "2026-04-15" },
    { accountId: main.id, amount: 75, type: "expense" as const, category: "Shopping", description: "New running shoes", date: "2026-04-18" },
    { accountId: brokerage.id, amount: 125, type: "income" as const, category: "Dividends", description: "VOO dividend", date: "2026-04-20" },
    { accountId: main.id, amount: 42, type: "expense" as const, category: "Food", description: "Restaurant dinner", date: "2026-04-22" },
  ];

  await db.insert(schema.transactions).values(txns);
  console.log("  Created 10 transactions");

  // Investments
  const investmentData = [
    { accountId: brokerage.id, symbol: "VOO", name: "Vanguard S&P 500 ETF", shares: 15, avgCostPerShare: 420.50 },
    { accountId: brokerage.id, symbol: "CSPX.L", name: "iShares Core S&P 500 UCITS ETF", shares: 10, avgCostPerShare: 520.00 },
    { accountId: brokerage.id, symbol: "FWRA.L", name: "Invesco FTSE All-World UCITS ETF", shares: 500, avgCostPerShare: 7.50 },
    { accountId: crypto.id, symbol: "BTC-USD", name: "Bitcoin", shares: 0.05, avgCostPerShare: 64000 },
  ];

  await db.insert(schema.investments).values(investmentData);
  console.log("  Created 4 investments");

  // Net worth snapshots (past 6 months)
  const snapshotData = [
    { totalAssets: 28500, totalLiabilities: 0, netWorth: 28500, date: "2025-11-01" },
    { totalAssets: 29800, totalLiabilities: 0, netWorth: 29800, date: "2025-12-01" },
    { totalAssets: 30200, totalLiabilities: 0, netWorth: 30200, date: "2026-01-01" },
    { totalAssets: 31500, totalLiabilities: 0, netWorth: 31500, date: "2026-02-01" },
    { totalAssets: 32800, totalLiabilities: 0, netWorth: 32800, date: "2026-03-01" },
    { totalAssets: 33620, totalLiabilities: 0, netWorth: 33620, date: "2026-04-01" },
  ];

  await db.insert(schema.netWorthSnapshots).values(snapshotData);
  console.log("  Created 6 net worth snapshots");

  sqlite.pragma("wal_checkpoint(TRUNCATE)");
  console.log("Mock seed complete!");
  process.exit(0);
}

seedMock().catch((err) => {
  console.error("Mock seed failed:", err);
  process.exit(1);
});
