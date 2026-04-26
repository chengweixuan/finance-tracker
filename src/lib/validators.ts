import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["bank", "brokerage", "crypto", "other"]),
  balance: z.number().default(0),
  currency: z.string().default("USD"),
});

export const updateAccountSchema = createAccountSchema.partial();

export const createTransactionSchema = z.object({
  accountId: z.number().int().positive(),
  amount: z.number(),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

export const createInvestmentSchema = z.object({
  accountId: z.number().int().positive(),
  symbol: z.string().min(1).transform((s) => s.toUpperCase()),
  name: z.string().min(1, "Name is required"),
  shares: z.number().positive("Shares must be positive"),
  avgCostPerShare: z.number().positive("Cost must be positive"),
});

export const updateInvestmentSchema = createInvestmentSchema.partial();
