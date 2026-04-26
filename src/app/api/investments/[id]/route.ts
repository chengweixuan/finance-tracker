import { NextResponse } from "next/server";
import { db } from "@/db";
import { investments } from "@/db/schema";
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

    const [updated] = await db
      .update(investments)
      .set({ ...result.data, updatedAt: new Date().toISOString() })
      .where(eq(investments.id, parseInt(id)))
      .returning();

    if (!updated) return errorResponse("Investment not found", 404);
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
