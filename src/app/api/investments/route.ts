import { NextResponse } from "next/server";
import { db } from "@/db";
import { investments, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createInvestmentSchema } from "@/lib/validators";
import { validateBody, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const results = await db
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

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateBody(createInvestmentSchema, body);
    if ("error" in result) return result.error;

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, result.data.accountId),
    });
    if (!account) return errorResponse("Account not found", 404);

    const existing = await db.query.investments.findFirst({
      where: and(
        eq(investments.accountId, result.data.accountId),
        eq(investments.symbol, result.data.symbol),
      ),
    });

    if (existing) {
      const totalShares = existing.shares + result.data.shares;
      const newAvgCost =
        (existing.shares * existing.avgCostPerShare + result.data.shares * result.data.avgCostPerShare) / totalShares;

      const [updated] = await db
        .update(investments)
        .set({
          shares: totalShares,
          avgCostPerShare: newAvgCost,
          name: result.data.name,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(investments.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    }

    const [newInvestment] = await db.insert(investments).values(result.data).returning();
    return NextResponse.json(newInvestment, { status: 201 });
  } catch {
    return errorResponse("Failed to create investment", 500);
  }
}
