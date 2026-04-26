"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/transaction-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, ArrowLeftRight, Trash2 } from "lucide-react";
import type { Account, TransactionWithAccount } from "@/lib/types";

const typeColors: Record<string, string> = {
  income: "bg-emerald-100 text-emerald-800",
  expense: "bg-red-100 text-red-800",
  transfer: "bg-blue-100 text-blue-800",
};

export function TransactionsList({
  transactions: initialTransactions,
  accounts,
}: {
  transactions: TransactionWithAccount[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filterType, setFilterType] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  async function applyFilters() {
    const params = new URLSearchParams();
    if (filterType !== "all") params.set("type", filterType);
    if (filterAccount !== "all") params.set("accountId", filterAccount);
    if (filterStartDate) params.set("startDate", filterStartDate);
    if (filterEndDate) params.set("endDate", filterEndDate);

    const res = await fetch(`/api/transactions?${params.toString()}`);
    const data = await res.json();
    setTransactions(data);
  }

  function handleDone() {
    setDialogOpen(false);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (initialTransactions.length === 0 && filterType === "all" && filterAccount === "all") {
    return (
      <>
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Add your first transaction to start tracking income and expenses."
          actionLabel="Add Transaction"
          onAction={() => setDialogOpen(true)}
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent onClose={() => setDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm accounts={accounts} onSubmit={handleDone} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Type</label>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-32">
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Account</label>
          <Select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="w-40">
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-36" />
        </div>
        <Button variant="secondary" size="sm" onClick={applyFilters}>Filter</Button>
        <div className="flex-1" />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Transaction
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Account</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-right p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-muted/25">
                <td className="p-3">{formatDate(t.date)}</td>
                <td className="p-3">{t.accountName}</td>
                <td className="p-3">
                  <Badge className={typeColors[t.type]}>{t.type}</Badge>
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{t.category}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">{t.description || "—"}</td>
                <td className={`p-3 text-right font-mono font-medium ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No transactions match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm accounts={accounts} onSubmit={handleDone} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
