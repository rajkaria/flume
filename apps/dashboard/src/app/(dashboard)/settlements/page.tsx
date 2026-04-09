import { MetricCard } from "@/components/metric-card";
import { settlements } from "@/lib/demo-data";

export default function SettlementsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Settlements</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Pending Settlement" value="$2.45" sub="Next settlement in 8m 32s" />
        <MetricCard label="Total Settled" value="$35.78" sub="Last 24 hours" />
        <MetricCard label="Settlement Wallet" value="0xabc1...def1" sub="Circle Developer Wallet" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">Settlement History</h3>
          <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium transition-colors">
            Manual Settle
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-left border-b border-zinc-800">
              <th className="p-4 font-medium">Batch ID</th>
              <th className="p-4 font-medium">Arc Tx</th>
              <th className="p-4 font-medium text-right">Tools</th>
              <th className="p-4 font-medium text-right">Amount</th>
              <th className="p-4 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {settlements.map((s) => (
              <tr key={s.batchId} className="hover:bg-zinc-800/50">
                <td className="p-4 font-mono text-xs">{s.batchId}</td>
                <td className="p-4 font-mono text-xs text-violet-400 cursor-pointer hover:underline">{s.arcTxHash}</td>
                <td className="p-4 text-right">{s.toolCount}</td>
                <td className="p-4 font-mono text-right">{s.totalAmount} USDC</td>
                <td className="p-4 text-xs text-zinc-400 text-right">{new Date(s.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
