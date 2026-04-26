import { NextResponse } from "next/server";
import { db } from "@/db";
import { investmentHistory, investments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const results = await db
    .select({
      id: investmentHistory.id,
      investmentId: investmentHistory.investmentId,
      type: investmentHistory.type,
      shares: investmentHistory.shares,
      pricePerShare: investmentHistory.pricePerShare,
      totalShares: investmentHistory.totalShares,
      avgCostPerShare: investmentHistory.avgCostPerShare,
      date: investmentHistory.date,
      createdAt: investmentHistory.createdAt,
      symbol: investments.symbol,
      investmentName: investments.name,
    })
    .from(investmentHistory)
    .leftJoin(investments, eq(investmentHistory.investmentId, investments.id))
    .orderBy(desc(investmentHistory.createdAt));

  return NextResponse.json(results);
}
