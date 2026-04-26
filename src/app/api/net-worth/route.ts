import { NextResponse } from "next/server";
import { db } from "@/db";
import { netWorthSnapshots, accounts, investments } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();
import { errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const snapshots = await db
    .select()
    .from(netWorthSnapshots)
    .orderBy(asc(netWorthSnapshots.date));

  return NextResponse.json(snapshots);
}

export async function POST() {
  try {
    const allAccounts = await db.select().from(accounts);
    const allInvestments = await db.select().from(investments);

    let totalAssets = allAccounts.reduce((sum, a) => sum + a.balance, 0);

    if (allInvestments.length > 0) {
      const symbols = [...new Set(allInvestments.map((i) => i.symbol))];
      for (const symbol of symbols) {
        try {
          const quote = await yahooFinance.quote(symbol);
          const price = quote.regularMarketPrice ?? 0;
          const holdingsForSymbol = allInvestments.filter((i) => i.symbol === symbol);
          for (const h of holdingsForSymbol) {
            totalAssets += h.shares * price;
          }
        } catch {
          const holdingsForSymbol = allInvestments.filter((i) => i.symbol === symbol);
          for (const h of holdingsForSymbol) {
            totalAssets += h.shares * h.avgCostPerShare;
          }
        }
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const existing = await db.query.netWorthSnapshots.findFirst({
      where: eq(netWorthSnapshots.date, today),
    });

    if (existing) {
      const [updated] = await db
        .update(netWorthSnapshots)
        .set({ totalAssets, totalLiabilities: 0, netWorth: totalAssets })
        .where(eq(netWorthSnapshots.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [snapshot] = await db
      .insert(netWorthSnapshots)
      .values({ totalAssets, totalLiabilities: 0, netWorth: totalAssets, date: today })
      .returning();

    return NextResponse.json(snapshot, { status: 201 });
  } catch {
    return errorResponse("Failed to create net worth snapshot", 500);
  }
}
