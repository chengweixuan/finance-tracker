import { NextResponse } from "next/server";
import { db } from "@/db";
import { investments, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    const [newInvestment] = await db.insert(investments).values(result.data).returning();
    return NextResponse.json(newInvestment, { status: 201 });
  } catch {
    return errorResponse("Failed to create investment", 500);
  }
}
