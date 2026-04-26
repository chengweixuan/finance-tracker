"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Account } from "@/lib/types";

interface AccountFormProps {
  account?: Account;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "bank");
  const [balance, setBalance] = useState(account?.balance?.toString() ?? "0");
  const [currency, setCurrency] = useState(account?.currency ?? "USD");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = account ? `/api/accounts/${account.id}` : "/api/accounts";
    const method = account ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, balance: parseFloat(balance), currency }),
    });

    setLoading(false);
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Account Type</Label>
        <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="bank">Bank</option>
          <option value="brokerage">Brokerage</option>
          <option value="crypto">Crypto</option>
          <option value="other">Other</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="balance">Balance</Label>
        <Input id="balance" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : account ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
