"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AccountForm } from "@/components/forms/account-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Wallet, Pencil, Trash2, PlusCircle } from "lucide-react";
import type { Account, Investment } from "@/lib/types";

const typeColors: Record<string, string> = {
  bank: "bg-blue-100 text-blue-800",
  brokerage: "bg-emerald-100 text-emerald-800",
  crypto: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

interface PriceData {
  price: number;
}

export function AccountsClient({ accounts, investments }: { accounts: Account[]; investments: Investment[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [addBalanceAccount, setAddBalanceAccount] = useState<Account | undefined>();
  const [addBalanceOpen, setAddBalanceOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});

  const fetchPrices = useCallback(async () => {
    if (investments.length === 0) return;
    const symbols = [...new Set(investments.map((i) => i.symbol))].join(",");
    try {
      const res = await fetch(`/api/investments/prices?symbols=${symbols}`);
      const data = await res.json();
      setPrices(data);
    } catch {
      // Prices will fall back to cost basis
    }
  }, [investments]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  function getPortfolioValue(accountId: number) {
    const holdings = investments.filter((i) => i.accountId === accountId);
    if (holdings.length === 0) return 0;
    return holdings.reduce((sum, inv) => {
      const price = prices[inv.symbol]?.price ?? inv.avgCostPerShare;
      return sum + inv.shares * price;
    }, 0);
  }

  function handleDone() {
    setDialogOpen(false);
    setEditingAccount(undefined);
    router.refresh();
  }

  async function handleDelete(account: Account) {
    const msg = `Are you sure you want to delete "${account.name}"?\n\nThis will permanently delete ALL transactions and investments linked to this account. This cannot be undone.`;
    if (!confirm(msg)) return;
    await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleAddBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!addBalanceAccount) return;
    setAddLoading(true);
    const newBalance = addBalanceAccount.balance + parseFloat(addAmount);
    await fetch(`/api/accounts/${addBalanceAccount.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: newBalance }),
    });
    setAddLoading(false);
    setAddBalanceOpen(false);
    setAddBalanceAccount(undefined);
    setAddAmount("");
    router.refresh();
  }

  if (accounts.length === 0) {
    return (
      <>
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first bank, brokerage, or crypto account to start tracking your finances."
          actionLabel="Add Account"
          onAction={() => setDialogOpen(true)}
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent onClose={() => setDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
            </DialogHeader>
            <AccountForm onSubmit={handleDone} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setEditingAccount(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Badge className={typeColors[account.type]}>{account.type}</Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600"
                    title="Add to balance"
                    onClick={() => { setAddBalanceAccount(account); setAddAmount(""); setAddBalanceOpen(true); }}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditingAccount(account); setDialogOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(account)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{account.name}</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(account.balance, account.currency)}</p>
              {(account.type === "brokerage" || account.type === "crypto") && (() => {
                const portfolioValue = getPortfolioValue(account.id);
                const holdingCount = investments.filter((i) => i.accountId === account.id).length;
                if (holdingCount === 0) return null;
                return (
                  <p className="text-sm text-muted-foreground mt-1">
                    Portfolio: <span className="font-medium text-foreground">{formatCurrency(portfolioValue, "USD")}</span>
                    <span className="ml-1">({holdingCount} holding{holdingCount !== 1 ? "s" : ""})</span>
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <AccountForm account={editingAccount} onSubmit={handleDone} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addBalanceOpen} onOpenChange={(open) => { setAddBalanceOpen(open); if (!open) setAddBalanceAccount(undefined); }}>
        <DialogContent onClose={() => { setAddBalanceOpen(false); setAddBalanceAccount(undefined); }}>
          <DialogHeader>
            <DialogTitle>Add to Balance — {addBalanceAccount?.name}</DialogTitle>
          </DialogHeader>
          {addBalanceAccount && (
            <form onSubmit={handleAddBalance} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current balance: <span className="font-medium text-foreground">{formatCurrency(addBalanceAccount.balance, addBalanceAccount.currency)}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="addAmount">Amount (use negative to subtract)</Label>
                <Input
                  id="addAmount"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500 or -200"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {addAmount && (
                <p className="text-sm text-muted-foreground">
                  New balance: <span className="font-medium text-foreground">{formatCurrency(addBalanceAccount.balance + parseFloat(addAmount || "0"), addBalanceAccount.currency)}</span>
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setAddBalanceOpen(false); setAddBalanceAccount(undefined); }}>Cancel</Button>
                <Button type="submit" disabled={addLoading || !addAmount}>
                  {addLoading ? "Saving..." : "Update Balance"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
