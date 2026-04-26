"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import type { Investment } from "@/lib/types";

interface AddSharesFormProps {
  investment: Investment;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AddSharesForm({ investment, onSubmit, onCancel }: AddSharesFormProps) {
  const [shares, setShares] = useState("");
  const [costPerShare, setCostPerShare] = useState("");
  const [loading, setLoading] = useState(false);

  const newShares = parseFloat(shares) || 0;
  const newCost = parseFloat(costPerShare) || 0;
  const totalCost = newShares * newCost;
  const totalShares = investment.shares + newShares;
  const newAvgCost = totalShares > 0
    ? (investment.shares * investment.avgCostPerShare + newShares * newCost) / totalShares
    : investment.avgCostPerShare;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch(`/api/investments/${investment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shares: totalShares,
        avgCostPerShare: newAvgCost,
      }),
    });

    setLoading(false);
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current shares</span>
          <span className="font-mono">{investment.shares.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current avg cost</span>
          <span className="font-mono">{formatCurrency(investment.avgCostPerShare)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="newShares">New Shares</Label>
          <Input id="newShares" type="number" step="0.0001" min="0" placeholder="e.g. 5" value={shares} onChange={(e) => setShares(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newCost">Price per Share</Label>
          <Input id="newCost" type="number" step="0.01" min="0" placeholder="e.g. 780.50" value={costPerShare} onChange={(e) => setCostPerShare(e.target.value)} required />
        </div>
      </div>

      {newShares > 0 && newCost > 0 && (
        <div className="rounded-lg border p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contribution</span>
            <span className="font-mono">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">New total shares</span>
            <span className="font-mono">{totalShares.toFixed(4)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>New avg cost</span>
            <span className="font-mono">{formatCurrency(newAvgCost)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || newShares <= 0 || newCost <= 0}>
          {loading ? "Saving..." : "Add Shares"}
        </Button>
      </div>
    </form>
  );
}
