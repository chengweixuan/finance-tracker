import { db } from "@/db";
import { accounts, transactions, netWorthSnapshots } from "@/db/schema";
import { desc, asc, eq } from "drizzle-orm";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { DollarSign, Wallet, TrendingUp, ArrowLeftRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DashboardActions } from "./dashboard-actions";

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

  const totalBalance = allAccounts.reduce((sum, a) => sum + a.balance, 0);
  const bankBalance = allAccounts.filter((a) => a.type === "bank").reduce((sum, a) => sum + a.balance, 0);
  const investmentAccounts = allAccounts.filter((a) => a.type === "brokerage" || a.type === "crypto");

  const allocationData = allAccounts
    .filter((a) => a.balance > 0)
    .map((a) => ({ name: a.name, value: a.balance }));

  const chartData = snapshots.map((s) => ({ date: s.date, netWorth: s.netWorth }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Your financial overview</p>
        </div>
        <DashboardActions />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Net Worth"
          value={formatCurrency(snapshots.at(-1)?.netWorth ?? totalBalance)}
          icon={DollarSign}
        />
        <SummaryCard
          title="Bank Accounts"
          value={formatCurrency(bankBalance)}
          icon={Wallet}
        />
        <SummaryCard
          title="Investment Accounts"
          value={`${investmentAccounts.length} accounts`}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Total Accounts"
          value={`${allAccounts.length}`}
          icon={ArrowLeftRight}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="md:col-span-4">
          <NetWorthChart data={chartData} />
        </div>
        <div className="md:col-span-3">
          <AllocationChart data={allocationData} />
        </div>
      </div>

      <RecentTransactions
        transactions={recentTransactions.map((t) => ({ ...t, accountName: t.accountName ?? "Unknown" }))}
      />
    </div>
  );
}
