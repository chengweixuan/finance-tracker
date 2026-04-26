import { db } from "@/db";
import { investments, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PortfolioView } from "./portfolio-view";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const allInvestments = await db
    .select({
      id: investments.id,
      accountId: investments.accountId,
      symbol: investments.symbol,
      name: investments.name,
      shares: investments.shares,
      avgCostPerShare: investments.avgCostPerShare,
      createdAt: investments.createdAt,
      updatedAt: investments.updatedAt,
      accountName: accounts.name,
    })
    .from(investments)
    .leftJoin(accounts, eq(investments.accountId, accounts.id));

  const allAccounts = await db.select().from(accounts);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Investments</h2>
        <p className="text-muted-foreground">Track your portfolio with live prices</p>
      </div>
      <PortfolioView
        investments={allInvestments.map((i) => ({ ...i, accountName: i.accountName ?? "Unknown" }))}
        accounts={allAccounts}
      />
    </div>
  );
}
