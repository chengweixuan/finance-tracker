import { db } from "@/db";
import { budgetConfig, budgetAllocations } from "@/db/schema";
import { BudgetClient } from "./budget-client";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const config = await db.select().from(budgetConfig).limit(1);
  const allocations = await db.select().from(budgetAllocations);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Budget</h2>
        <p className="text-muted-foreground">Plan your monthly salary allocation</p>
      </div>
      <BudgetClient
        initialSalary={config[0]?.monthlySalary ?? 0}
        initialAllocations={allocations.map((a) => ({ id: a.id, category: a.category, amount: a.amount }))}
      />
    </div>
  );
}
