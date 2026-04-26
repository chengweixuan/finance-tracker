import { NextResponse } from "next/server";
import { db } from "@/db";
import { investments, investmentHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateInvestmentSchema } from "@/lib/validators";
import { validateBody, errorResponse } from "@/lib/api-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investment = await db.query.investments.findFirst({
    where: eq(investments.id, parseInt(id)),
  });
  if (!investment) return errorResponse("Investment not found", 404);
  return NextResponse.json(investment);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = validateBody(updateInvestmentSchema, body);
    if ("error" in result) return result.error;

    const existing = await db.query.investments.findFirst({
      where: eq(investments.id, parseInt(id)),
    });
    if (!existing) return errorResponse("Investment not found", 404);

    const [updated] = await db
      .update(investments)
      .set({ ...result.data, updatedAt: new Date().toISOString() })
      .where(eq(investments.id, parseInt(id)))
      .returning();

    const today = new Date().toISOString().split("T")[0];
    const isAddShares = result.data.shares && result.data.shares > existing.shares && !result.data.symbol;

    await db.insert(investmentHistory).values({
      investmentId: updated.id,
      type: isAddShares ? "buy" : "edit",
      shares: isAddShares ? updated.shares - existing.shares : updated.shares,
      pricePerShare: result.data.avgCostPerShare ?? existing.avgCostPerShare,
      totalShares: updated.shares,
      avgCostPerShare: updated.avgCostPerShare,
      date: today,
    });

    return NextResponse.json(updated);
  } catch {
    return errorResponse("Failed to update investment", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(investments).where(eq(investments.id, parseInt(id))).returning();
  if (!deleted) return errorResponse("Investment not found", 404);
  return NextResponse.json({ success: true });
}
