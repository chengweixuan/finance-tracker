import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import type { TransactionWithAccount } from "@/lib/types";

const typeIcons = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  transfer: ArrowLeftRight,
};

export function RecentTransactions({ transactions, currency = "USD", exchangeRate = 1 }: { transactions: TransactionWithAccount[]; currency?: string; exchangeRate?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => {
              const Icon = typeIcons[t.type];
              const isIncome = t.type === "income";
              return (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1.5 ${isIncome ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description || t.category}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t.category}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
                    {isIncome ? "+" : "-"}{formatCurrency(Math.abs(t.amount) * exchangeRate, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
