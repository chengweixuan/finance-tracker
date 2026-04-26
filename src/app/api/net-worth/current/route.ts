import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, investments, transactions } from "@/db/schema";
import { eq, and, sum } from "drizzle-orm";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function GET() {
  const allAccounts = await db.select().from(accounts);
  const allInvestments = await db.select().from(investments);

  const bankBalance = allAccounts.reduce((sum, a) => sum + a.balance, 0);
  let investmentValue = 0;
  const investmentCostBasis = allInvestments.reduce((s, i) => s + i.shares * i.avgCostPerShare, 0);

  if (allInvestments.length > 0) {
    const symbols = [...new Set(allInvestments.map((i) => i.symbol))];
    for (const symbol of symbols) {
      try {
        const quote = await yahooFinance.quote(symbol);
        const price = quote.regularMarketPrice ?? 0;
        const holdingsForSymbol = allInvestments.filter((i) => i.symbol === symbol);
        for (const h of holdingsForSymbol) {
          investmentValue += h.shares * price;
        }
      } catch {
        const holdingsForSymbol = allInvestments.filter((i) => i.symbol === symbol);
        for (const h of holdingsForSymbol) {
          investmentValue += h.shares * h.avgCostPerShare;
        }
      }
    }
  }

  const dividendResult = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.type, "income"), eq(transactions.category, "Dividends")));
  const dividendIncome = Number(dividendResult[0]?.total ?? 0);

  const unrealizedGain = investmentValue - investmentCostBasis;
  const totalReturns = unrealizedGain + dividendIncome;

  return NextResponse.json({
    bankBalance,
    investmentValue,
    investmentCostBasis,
    unrealizedGain,
    dividendIncome,
    totalReturns,
    totalAssets: bankBalance + investmentValue,
    totalLiabilities: 0,
    netWorth: bankBalance + investmentValue,
  });
}
