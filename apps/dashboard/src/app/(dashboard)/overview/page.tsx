import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { RevenueChart } from "@/components/revenue-chart";
import { recentTransactions } from "@/lib/demo-data";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Earned" value="$4,380.00" sub="All-time USDC" />
        <MetricCard label="Today's Earnings" value="$4.38" sub="+12% from yesterday" />
        <MetricCard label="Calls Today" value="1,275" sub="Across 5 tools" />
        <MetricCard label="Active Callers" value="47" sub="Unique wallets" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Revenue (Last 24h)</h3>
        <RevenueChart />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Recent Transactions</h3>
          <span className="text-xs text-zinc-500">Pending settlement: $2.45 USDC</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-left">
              <th className="pb-3 font-medium">Tool</th>
              <th className="pb-3 font-medium">Caller</th>
              <th className="pb-3 font-medium text-right">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {recentTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-zinc-800/50">
                <td className="py-3 font-mono text-xs">{tx.toolId}</td>
                <td className="py-3 font-mono text-xs text-zinc-400">{tx.caller}</td>
                <td className="py-3 font-mono text-xs text-right">{tx.amount} USDC</td>
                <td className="py-3"><StatusBadge status={tx.status} /></td>
                <td className="py-3 text-xs text-zinc-500 text-right">{tx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
