import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateAccountSchema } from "@/lib/validators";
import { validateBody, errorResponse } from "@/lib/api-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, parseInt(id)),
  });
  if (!account) return errorResponse("Account not found", 404);
  return NextResponse.json(account);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = validateBody(updateAccountSchema, body);
    if ("error" in result) return result.error;

    const [updated] = await db
      .update(accounts)
      .set({ ...result.data, updatedAt: new Date().toISOString() })
      .where(eq(accounts.id, parseInt(id)))
      .returning();

    if (!updated) return errorResponse("Account not found", 404);
    return NextResponse.json(updated);
  } catch {
    return errorResponse("Failed to update account", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(accounts).where(eq(accounts.id, parseInt(id))).returning();
  if (!deleted) return errorResponse("Account not found", 404);
  return NextResponse.json({ success: true });
}
