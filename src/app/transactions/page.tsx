import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TransactionsList } from "./transactions-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const allTransactions = await db
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
    .limit(50);

  const allAccounts = await db.select().from(accounts);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <p className="text-muted-foreground">Track your income and expenses</p>
      </div>
      <TransactionsList
        transactions={allTransactions.map((t) => ({ ...t, accountName: t.accountName ?? "Unknown" }))}
        accounts={allAccounts}
      />
    </div>
  );
}
