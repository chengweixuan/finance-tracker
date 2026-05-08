import { NextResponse } from "next/server";
import { db } from "@/db";
import { taxConfig } from "@/db/schema";
import { errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const config = await db.select().from(taxConfig).limit(1);
  if (!config[0]) {
    return NextResponse.json({ income: 0, monthlyMode: false, reliefs: [], customReliefs: [] });
  }
  return NextResponse.json({
    income: config[0].income,
    monthlyMode: config[0].monthlyMode === 1,
    reliefs: JSON.parse(config[0].reliefs),
    customReliefs: JSON.parse(config[0].customReliefs),
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { income, monthlyMode, reliefs, customReliefs } = body;

    const existing = await db.select().from(taxConfig).limit(1);
    if (existing.length > 0) {
      await db.update(taxConfig).set({
        income: income ?? 0,
        monthlyMode: monthlyMode ? 1 : 0,
        reliefs: JSON.stringify(reliefs ?? []),
        customReliefs: JSON.stringify(customReliefs ?? []),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.insert(taxConfig).values({
        income: income ?? 0,
        monthlyMode: monthlyMode ? 1 : 0,
        reliefs: JSON.stringify(reliefs ?? []),
        customReliefs: JSON.stringify(customReliefs ?? []),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Failed to save tax config", 500);
  }
}
