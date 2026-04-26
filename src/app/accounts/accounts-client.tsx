"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AccountForm } from "@/components/forms/account-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/format";
import { Plus, Wallet, Pencil, Trash2 } from "lucide-react";
import type { Account } from "@/lib/types";

const typeColors: Record<string, string> = {
  bank: "bg-blue-100 text-blue-800",
  brokerage: "bg-emerald-100 text-emerald-800",
  crypto: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  function handleDone() {
    setDialogOpen(false);
    setEditingAccount(undefined);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this account? All related transactions and investments will also be deleted.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
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
                    className="h-8 w-8"
                    onClick={() => { setEditingAccount(account); setDialogOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{account.name}</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(account.balance)}</p>
              <p className="text-xs text-muted-foreground mt-1">{account.currency}</p>
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
    </>
  );
}
