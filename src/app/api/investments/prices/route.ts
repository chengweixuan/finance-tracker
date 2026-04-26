import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const cache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 60_000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols parameter required" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
  const prices: Record<string, { price: number; change: number; changePercent: number; name: string }> = {};

  for (const symbol of symbols) {
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      prices[symbol] = cached.data as (typeof prices)[string];
      continue;
    }

    try {
      const quote = await yahooFinance.quote(symbol);
      const data = {
        price: quote.regularMarketPrice ?? 0,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        name: quote.shortName ?? quote.longName ?? symbol,
      };
      prices[symbol] = data;
      cache.set(symbol, { data, timestamp: Date.now() });
    } catch {
      prices[symbol] = { price: 0, change: 0, changePercent: 0, name: symbol };
    }
  }

  return NextResponse.json(prices);
}
