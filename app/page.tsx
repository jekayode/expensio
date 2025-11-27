"use client";

import { AccountSummary } from "@/components/dashboard/AccountSummary";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="text-sm text-zinc-400">Welcome back, {displayName}</div>
      </div>

      <AccountSummary />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <CashFlowChart />
        </div>
        <div className="col-span-3">
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}
