import { db } from "@/db";
import { accounts } from "@/db/schema";
import { AccountsClient } from "./accounts-client";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const allAccounts = await db.select().from(accounts);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <p className="text-muted-foreground">Manage your bank, brokerage, and crypto accounts</p>
      </div>
      <AccountsClient accounts={allAccounts} />
    </div>
  );
}
