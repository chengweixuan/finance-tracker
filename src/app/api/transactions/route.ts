import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { createTransactionSchema } from "@/lib/validators";
import { validateBody, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId");
  const type = url.searchParams.get("type");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const conditions = [];
  if (accountId) conditions.push(eq(transactions.accountId, parseInt(accountId)));
  if (type) conditions.push(eq(transactions.type, type as "income" | "expense" | "transfer"));
  if (startDate) conditions.push(gte(transactions.date, startDate));
  if (endDate) conditions.push(lte(transactions.date, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
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
    .where(where)
    .orderBy(desc(transactions.date))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateBody(createTransactionSchema, body);
    if ("error" in result) return result.error;

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, result.data.accountId),
    });
    if (!account) return errorResponse("Account not found", 404);

    const [newTransaction] = await db.insert(transactions).values(result.data).returning();

    const balanceChange = result.data.type === "income" ? result.data.amount : -result.data.amount;
    await db
      .update(accounts)
      .set({
        balance: account.balance + balanceChange,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, result.data.accountId));

    return NextResponse.json(newTransaction, { status: 201 });
  } catch {
    return errorResponse("Failed to create transaction", 500);
  }
}
