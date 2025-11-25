import { AccountSummary } from "@/components/dashboard/AccountSummary";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="text-sm text-zinc-400">Welcome back, Emmanuel</div>
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
