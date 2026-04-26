"use client";

import { useState, useEffect, useCallback } from "react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { DashboardActions } from "./dashboard-actions";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { DollarSign, Wallet, TrendingUp, BarChart3 } from "lucide-react";
import type { Account, TransactionWithAccount } from "@/lib/types";

interface InvestmentSummary {
  bankBalance: number;
  investmentValue: number;
  investmentCostBasis: number;
  unrealizedGain: number;
  dividendIncome: number;
  totalReturns: number;
  totalAssets: number;
  netWorth: number;
}

export function DashboardClient({
  accounts,
  transactions,
  snapshots,
}: {
  accounts: Account[];
  transactions: TransactionWithAccount[];
  snapshots: { date: string; netWorth: number }[];
}) {
  const [displayCurrency, setDisplayCurrency] = useState<"SGD" | "USD">("SGD");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);

  const fetchExchangeRate = useCallback(async () => {
    if (displayCurrency === "USD") {
      setExchangeRate(1);
      return;
    }
    try {
      const res = await fetch("/api/investments/prices?symbols=SGDUSD=X");
      const data = await res.json();
      const rate = data["SGDUSD=X"]?.price;
      if (rate && rate > 0) {
        setExchangeRate(1 / rate);
      }
    } catch {
      // Fallback
    }
  }, [displayCurrency]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/net-worth/current");
      const data = await res.json();
      setSummary(data);
    } catch {
      // Will use account balances as fallback
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  // Account balances are in SGD, investment values are in USD
  const usdToDisplay = (amount: number) => displayCurrency === "USD" ? amount : amount * exchangeRate;
  const sgdToDisplay = (amount: number) => displayCurrency === "SGD" ? amount : amount / exchangeRate;
  const fmtDisplay = (amount: number) => formatCurrency(amount, displayCurrency);

  const cashAccounts = accounts.filter((a) => a.type === "bank" || a.type === "other");
  const cashBalanceSGD = cashAccounts.reduce((s, a) => s + a.balance, 0);
  const investmentValueUSD = summary?.investmentValue ?? 0;
  const totalReturnsUSD = summary?.totalReturns ?? 0;

  const cashInDisplay = sgdToDisplay(cashBalanceSGD);
  const investmentInDisplay = usdToDisplay(investmentValueUSD);
  const netWorth = cashInDisplay + investmentInDisplay;
  const totalReturns = usdToDisplay(totalReturnsUSD);

  const allocationData = [
    ...cashAccounts.filter((a) => a.balance > 0).map((a) => ({ name: a.name, value: sgdToDisplay(a.balance) })),
    ...(investmentValueUSD > 0 ? [{ name: "Investments", value: investmentInDisplay }] : []),
  ];

  const chartData = snapshots.map((s) => ({ date: s.date, netWorth: sgdToDisplay(s.netWorth) }));

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Your financial overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as "SGD" | "USD")}
            className="w-24 h-8 text-xs"
          >
            <option value="SGD">SGD</option>
            <option value="USD">USD</option>
          </Select>
          <DashboardActions />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Net Worth"
          value={fmtDisplay(netWorth)}
          icon={DollarSign}
        />
        <SummaryCard
          title="Cash Balance"
          value={fmtDisplay(cashInDisplay)}
          icon={Wallet}
        />
        <SummaryCard
          title="Investment Value"
          value={fmtDisplay(investmentInDisplay)}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Total Returns"
          value={fmtDisplay(totalReturns)}
          icon={BarChart3}
          trend={
            summary
              ? `${summary.unrealizedGain >= 0 ? "+" : ""}${fmtDisplay(usdToDisplay(summary.unrealizedGain))} unrealized, ${fmtDisplay(usdToDisplay(summary.dividendIncome))} dividends`
              : undefined
          }
          trendUp={totalReturns >= 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="md:col-span-4">
          <NetWorthChart data={chartData} currency={displayCurrency} />
        </div>
        <div className="md:col-span-3">
          <AllocationChart data={allocationData} currency={displayCurrency} />
        </div>
      </div>

      <RecentTransactions transactions={transactions} currency={displayCurrency} exchangeRate={displayCurrency === "SGD" ? 1 : 1 / exchangeRate} />
    </>
  );
}
