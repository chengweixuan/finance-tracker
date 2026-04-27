import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgetConfig, budgetAllocations } from "@/db/schema";
import { budgetSchema } from "@/lib/validators";
import { validateBody, errorResponse } from "@/lib/api-helpers";
import { sql } from "drizzle-orm";

export async function GET() {
  const config = await db.select().from(budgetConfig).limit(1);
  const allocations = await db.select().from(budgetAllocations);

  return NextResponse.json({
    salary: config[0]?.monthlySalary ?? 0,
    allocations: allocations.map((a) => ({ id: a.id, category: a.category, amount: a.amount })),
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = validateBody(budgetSchema, body);
    if ("error" in result) return result.error;

    const { salary, allocations } = result.data;

    const existing = await db.select().from(budgetConfig).limit(1);
    if (existing.length > 0) {
      await db.update(budgetConfig).set({ monthlySalary: salary, updatedAt: new Date().toISOString() });
    } else {
      await db.insert(budgetConfig).values({ monthlySalary: salary });
    }

    await db.run(sql`DELETE FROM budget_allocations`);

    if (allocations.length > 0) {
      await db.insert(budgetAllocations).values(
        allocations.map((a) => ({ category: a.category, amount: a.amount }))
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Failed to save budget", 500);
  }
}
