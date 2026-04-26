import { db } from "@/db";
import { accounts, transactions, netWorthSnapshots } from "@/db/schema";
import { desc, asc, eq } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allAccounts = await db.select().from(accounts);

  const recentTransactions = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      amount: transactions.amount,
      type: transactions.type,
      category: transactions.category,
      description: transactions.description,
      date: transactions.date,
      createdAt: transactions.createdAt,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .orderBy(desc(transactions.date))
    .limit(5);

  const snapshots = await db
    .select()
    .from(netWorthSnapshots)
    .orderBy(asc(netWorthSnapshots.date));

  return (
    <div className="space-y-6">
      <DashboardClient
        accounts={allAccounts}
        transactions={recentTransactions.map((t) => ({ ...t, accountName: t.accountName ?? "Unknown" }))}
        snapshots={snapshots.map((s) => ({ date: s.date, netWorth: s.netWorth }))}
      />
    </div>
  );
}
