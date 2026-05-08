import { db } from "@/db";
import { taxConfig } from "@/db/schema";
import { TaxClient } from "./tax-client";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const config = await db.select().from(taxConfig).limit(1);

  const initialData = config[0]
    ? {
        income: config[0].income,
        monthlyMode: config[0].monthlyMode === 1,
        reliefs: JSON.parse(config[0].reliefs) as { id: string; enabled: boolean; amount: number }[],
        customReliefs: JSON.parse(config[0].customReliefs) as { label: string; amount: number }[],
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tax Calculator</h2>
        <p className="text-muted-foreground">Singapore income tax estimation (YA 2024 rates)</p>
      </div>
      <TaxClient initialData={initialData} />
    </div>
  );
}
