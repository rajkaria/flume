import { StatusBadge } from "@/components/status-badge";
import { recentTransactions } from "@/lib/demo-data";

const allEntries = [
  ...recentTransactions,
  { id: "9", toolId: "analyze", caller: "0x3m4n...5o6p", amount: "0.010000", status: "validated" as const, time: "35m ago" },
  { id: "10", toolId: "search", caller: "0x7q8r...9s0t", amount: "0.005000", status: "settled" as const, time: "40m ago" },
];

export default function AuditPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Audit Log</h2>
        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
          Export CSV
        </button>
      </div>

      <div className="flex gap-3">
        <select className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
          <option>All Tools</option>
          <option>search</option>
          <option>analyze</option>
          <option>summarize</option>
        </select>
        <select className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
          <option>All Events</option>
          <option>payment.validated</option>
          <option>payment.rejected</option>
          <option>settlement.completed</option>
        </select>
        <select className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
          <option>Last 24h</option>
          <option>Last 7d</option>
          <option>Last 30d</option>
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-left border-b border-zinc-800">
              <th className="p-4 font-medium">Time</th>
              <th className="p-4 font-medium">Event</th>
              <th className="p-4 font-medium">Tool</th>
              <th className="p-4 font-medium">Caller</th>
              <th className="p-4 font-medium text-right">Amount</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {allEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-zinc-800/50 cursor-pointer">
                <td className="p-4 text-xs text-zinc-400">{entry.time}</td>
                <td className="p-4 font-mono text-xs">payment.{entry.status}</td>
                <td className="p-4 font-mono text-xs">{entry.toolId}</td>
                <td className="p-4 font-mono text-xs text-zinc-400">{entry.caller}</td>
                <td className="p-4 font-mono text-xs text-right">{entry.amount} USDC</td>
                <td className="p-4"><StatusBadge status={entry.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
