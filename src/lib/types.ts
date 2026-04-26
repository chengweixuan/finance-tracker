import type { accounts, transactions, investments, netWorthSnapshots } from "@/db/schema";

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;

export type NetWorthSnapshot = typeof netWorthSnapshots.$inferSelect;
export type NewNetWorthSnapshot = typeof netWorthSnapshots.$inferInsert;

export type InvestmentWithPrice = Investment & {
  currentPrice: number;
  marketValue: number;
  gain: number;
  gainPercent: number;
};

export type PortfolioSummary = {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  holdings: InvestmentWithPrice[];
};

export type TransactionWithAccount = Transaction & {
  accountName: string;
};
