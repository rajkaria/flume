"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { topCallers } from "@/lib/demo-data";

const policyViolations = [
  { name: "Over daily limit", value: 12 },
  { name: "Blocklisted", value: 3 },
  { name: "Over per-call", value: 7 },
  { name: "Global limit", value: 2 },
];

const PIE_COLORS = ["#7C3AED", "#ef4444", "#f59e0b", "#3b82f6"];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Callers by Spend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topCallers} layout="vertical">
              <XAxis type="number" stroke="#52525b" fontSize={11} tickFormatter={(v: number) => `$${v}`} />
              <YAxis type="category" dataKey="wallet" stroke="#52525b" fontSize={10} width={100} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="totalSpent" fill="#7C3AED" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Policy Violations</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={policyViolations} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {policyViolations.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Caller Leaderboard</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-left">
              <th className="pb-3 font-medium">Rank</th>
              <th className="pb-3 font-medium">Wallet</th>
              <th className="pb-3 font-medium text-right">Total Spent</th>
              <th className="pb-3 font-medium text-right">Calls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {topCallers.map((caller, i) => (
              <tr key={caller.wallet} className="hover:bg-zinc-800/50">
                <td className="py-3 text-zinc-500">#{i + 1}</td>
                <td className="py-3 font-mono text-xs">{caller.wallet}</td>
                <td className="py-3 font-mono text-right">{caller.totalSpent} USDC</td>
                <td className="py-3 text-right">{caller.callCount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
