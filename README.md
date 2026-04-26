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

# (Optional) Seed with mock data for development
npm run db:mock

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
| `npm run db:reset` | Wipe all data (keeps schema intact) |
| `npm run db:mock` | Seed fake sample data for development |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Database

The database is a single SQLite file (`sqlite.db`) at the project root. It persists across dev server restarts — your data stays until you explicitly reset it.

**Typical workflows:**

```bash
# Development — start fresh with mock data
npm run db:reset && npm run db:mock

# Real data — reset then add your data through the UI
npm run db:reset
npm run dev
```

The `sqlite.db` file is gitignored so your personal finance data is never committed.

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
