import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { errorResponse } from "@/lib/api-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, parseInt(id)),
  });
  if (!transaction) return errorResponse("Transaction not found", 404);
  return NextResponse.json(transaction);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, parseInt(id)),
  });
  if (!transaction) return errorResponse("Transaction not found", 404);

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, transaction.accountId),
  });

  await db.delete(transactions).where(eq(transactions.id, parseInt(id)));

  if (account) {
    const balanceRevert = transaction.type === "income" ? -transaction.amount : transaction.amount;
    await db
      .update(accounts)
      .set({
        balance: account.balance + balanceRevert,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, account.id));
  }

  return NextResponse.json({ success: true });
}
