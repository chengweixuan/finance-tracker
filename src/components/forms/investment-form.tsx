"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Account, Investment } from "@/lib/types";

interface InvestmentFormProps {
  accounts: Account[];
  investment?: Investment;
  onSubmit: () => void;
  onCancel: () => void;
}

export function InvestmentForm({ accounts, investment, onSubmit, onCancel }: InvestmentFormProps) {
  const brokerageAccounts = accounts.filter((a) => a.type === "brokerage" || a.type === "crypto");
  const [accountId, setAccountId] = useState(investment?.accountId?.toString() ?? brokerageAccounts[0]?.id?.toString() ?? "");
  const [symbol, setSymbol] = useState(investment?.symbol ?? "");
  const [name, setName] = useState(investment?.name ?? "");
  const [shares, setShares] = useState(investment?.shares?.toString() ?? "");
  const [avgCostPerShare, setAvgCostPerShare] = useState(investment?.avgCostPerShare?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = investment ? `/api/investments/${investment.id}` : "/api/investments";
    const method = investment ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: parseInt(accountId),
        symbol: symbol.toUpperCase(),
        name,
        shares: parseFloat(shares),
        avgCostPerShare: parseFloat(avgCostPerShare),
      }),
    });

    setLoading(false);
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="account">Account</Label>
        <Select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
          {brokerageAccounts.length === 0 ? (
            <option value="">No brokerage accounts — create one first</option>
          ) : (
            brokerageAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))
          )}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input id="symbol" placeholder="e.g. AAPL, VOO" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="investmentName">Name</Label>
          <Input id="investmentName" placeholder="e.g. Apple Inc." value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shares">Shares</Label>
          <Input id="shares" type="number" step="0.0001" min="0" value={shares} onChange={(e) => setShares(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avgCost">Avg Cost / Share (USD)</Label>
          <Input id="avgCost" type="number" step="0.01" min="0" value={avgCostPerShare} onChange={(e) => setAvgCostPerShare(e.target.value)} required />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || brokerageAccounts.length === 0}>
          {loading ? "Saving..." : investment ? "Update" : "Add Investment"}
        </Button>
      </div>
    </form>
  );
}
