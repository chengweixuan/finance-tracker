"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InvestmentForm } from "@/components/forms/investment-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Plus, RefreshCw, TrendingUp, Trash2 } from "lucide-react";
import type { Account, Investment } from "@/lib/types";

type InvestmentWithAccount = Investment & { accountName: string };

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  name: string;
}

export function PortfolioView({
  investments,
  accounts,
}: {
  investments: InvestmentWithAccount[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const fetchPrices = useCallback(async () => {
    if (investments.length === 0) return;
    setLoadingPrices(true);
    const symbols = [...new Set(investments.map((i) => i.symbol))].join(",");
    try {
      const res = await fetch(`/api/investments/prices?symbols=${symbols}`);
      const data = await res.json();
      setPrices(data);
    } catch {
      // Prices will show as 0
    }
    setLoadingPrices(false);
  }, [investments]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  function handleDone() {
    setDialogOpen(false);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this investment?")) return;
    await fetch(`/api/investments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const enriched = investments.map((inv) => {
    const price = prices[inv.symbol]?.price ?? 0;
    const marketValue = inv.shares * price;
    const costBasis = inv.shares * inv.avgCostPerShare;
    const gain = marketValue - costBasis;
    const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
    return { ...inv, currentPrice: price, marketValue, gain, gainPercent, costBasis };
  });

  const totalValue = enriched.reduce((s, i) => s + i.marketValue, 0);
  const totalCost = enriched.reduce((s, i) => s + i.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  if (investments.length === 0) {
    return (
      <>
        <EmptyState
          icon={TrendingUp}
          title="No investments yet"
          description="Add your first investment to start tracking your portfolio. Make sure you have a brokerage account first."
          actionLabel="Add Investment"
          onAction={() => setDialogOpen(true)}
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent onClose={() => setDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle>Add Investment</DialogTitle>
            </DialogHeader>
            <InvestmentForm accounts={accounts} onSubmit={handleDone} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(totalGain)} ({formatPercent(totalGainPercent)})
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={fetchPrices} disabled={loadingPrices}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingPrices ? "animate-spin" : ""}`} />
          Refresh Prices
        </Button>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Investment
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Symbol</th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-right p-3 font-medium">Shares</th>
              <th className="text-right p-3 font-medium">Avg Cost</th>
              <th className="text-right p-3 font-medium">Price</th>
              <th className="text-right p-3 font-medium">Market Value</th>
              <th className="text-right p-3 font-medium">Gain/Loss</th>
              <th className="text-right p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((inv) => (
              <tr key={inv.id} className="border-b hover:bg-muted/25">
                <td className="p-3">
                  <Badge variant="outline" className="font-mono">{inv.symbol}</Badge>
                </td>
                <td className="p-3">{inv.name}</td>
                <td className="p-3 text-right font-mono">{inv.shares.toFixed(4)}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(inv.avgCostPerShare)}</td>
                <td className="p-3 text-right font-mono">
                  {inv.currentPrice > 0 ? formatCurrency(inv.currentPrice) : "..."}
                </td>
                <td className="p-3 text-right font-mono">{formatCurrency(inv.marketValue)}</td>
                <td className={`p-3 text-right font-mono ${inv.gain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(inv.gain)} ({formatPercent(inv.gainPercent)})
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
          </DialogHeader>
          <InvestmentForm accounts={accounts} onSubmit={handleDone} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
