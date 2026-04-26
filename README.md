# Finance Tracker

A personal finance web app for tracking accounts, transactions, investments (with live stock/ETF prices), and net worth over time.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** + shadcn/ui components
- **SQLite** + Drizzle ORM
- **yahoo-finance2** for live stock/ETF prices
- **Recharts** for charts

## Getting Started

```bash
# Install dependencies
npm install

# Create the database and push schema
npm run db:push

# Seed with sample data (optional)
npm run db:seed

# Start dev server on port 3002
npm run dev
```

Open http://localhost:3002.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 3002) |
| `npm run build` | Production build |
| `npm run db:push` | Push schema changes to SQLite |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Project Structure

```
src/
  app/                  # Pages and API routes (file-based routing)
    api/                # REST endpoints (accounts, transactions, investments, net-worth)
    accounts/           # Accounts page
    investments/        # Portfolio page with live prices
    transactions/       # Transactions page with filters
  components/           # Reusable UI components
  db/                   # Drizzle schema, DB connection, seed script
  lib/                  # Types, validators, formatters, utilities
```
