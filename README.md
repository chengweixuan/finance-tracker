# Finance Tracker

A personal finance web app for tracking accounts, transactions, investments (with live stock/ETF prices), and net worth over time.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** + shadcn/ui components
- **SQLite** + Drizzle ORM
- **yahoo-finance2** for live stock/ETF prices and exchange rates
- **Recharts** for charts

## Features

- **Dashboard** with net worth, cash balance, investment value, and total returns (unrealized gains + dividends) summary cards. Net worth and allocation charts. Currency toggle (SGD/USD).
- **Accounts** management (bank, brokerage, crypto, other) with quick "add to balance" button, edit, and delete with cascade warnings.
- **Investments** portfolio with live prices from Yahoo Finance, per-row edit/add shares/delete actions, weighted average cost tracking, and investment history log.
- **Transactions** with filtering by account, type, date range, and category.
- **Net Worth** snapshots with manual "Take Snapshot" to record point-in-time totals.
- **Multi-currency** display — accounts stored in SGD, investments in USD, with live SGDUSD exchange rate conversion on both dashboard and investments pages.

## Getting Started

```bash
# Install dependencies
npm install

# Create the database and push schema
npm run db:push

# (Optional) Seed with mock data for development
npm run db:fresh

# Start dev server on port 3002
npm run dev
```

Open http://localhost:3002.

## Scripts

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Start dev server (port 3002)              |
| `npm run build`      | Production build                          |
| `npm run db:push`    | Push schema changes to SQLite             |
| `npm run db:reset`   | Wipe all data (keeps schema intact)       |
| `npm run db:mock`    | Seed mock data for development            |
| `npm run db:fresh`   | Reset + seed mock data in one step        |
| `npm run db:backup`  | Snapshot current DB to `sqlite.db.backup` |
| `npm run db:restore` | Restore DB from backup                    |
| `npm run db:studio`  | Open Drizzle Studio (DB browser)          |

## Database

The database is a single SQLite file (`sqlite.db`) at the project root in WAL mode. It persists across dev server restarts.

**Typical workflows:**

```bash
# Clear all data
npm run db:reset

# Save your real data before experimenting
npm run db:backup

# Start with mock data
npm run db:mock

# Restore your real data
npm run db:restore
```

Note: stop the dev server before running reset/restore to avoid stale WAL data.

All `sqlite.db*` and backup files are gitignored.

## Project Structure

```
src/
  app/                  # Pages and API routes (file-based routing)
    api/                # REST endpoints (accounts, transactions, investments, net-worth)
    accounts/           # Accounts page
    investments/        # Portfolio page with live prices
    transactions/       # Transactions page with filters
  components/           # Reusable UI components
    charts/             # Net worth and allocation charts
    dashboard/          # Summary cards, recent transactions
    forms/              # Account, investment, and add-shares forms
    shared/             # Empty state and other shared components
    ui/                 # Base UI primitives (button, card, dialog, etc.)
  db/                   # Drizzle schema, DB connection, seed/reset scripts
  lib/                  # Types, validators, formatters, utilities
```
