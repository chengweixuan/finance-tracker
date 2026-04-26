import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { createAccountSchema } from "@/lib/validators";
import { validateBody, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const allAccounts = await db.query.accounts.findMany({
    orderBy: (accounts, { asc }) => [asc(accounts.name)],
  });
  return NextResponse.json(allAccounts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateBody(createAccountSchema, body);
    if ("error" in result) return result.error;

    const [newAccount] = await db.insert(accounts).values(result.data).returning();
    return NextResponse.json(newAccount, { status: 201 });
  } catch {
    return errorResponse("Failed to create account", 500);
  }
}
