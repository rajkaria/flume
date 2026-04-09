import { StatusBadge } from "@/components/status-badge";
import { tools } from "@/lib/demo-data";

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tools</h2>
        <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">
          Add Tool
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-left border-b border-zinc-800">
              <th className="p-4 font-medium">Tool</th>
              <th className="p-4 font-medium">Protocol</th>
              <th className="p-4 font-medium">Strategy</th>
              <th className="p-4 font-medium text-right">Price</th>
              <th className="p-4 font-medium text-right">Calls Today</th>
              <th className="p-4 font-medium text-right">Earned Today</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {tools.map((tool) => (
              <tr key={tool.toolId} className="hover:bg-zinc-800/50 cursor-pointer">
                <td className="p-4">
                  <div className="font-medium">{tool.name}</div>
                  <div className="font-mono text-xs text-zinc-500">{tool.toolId}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-mono">{tool.protocol}</span>
                </td>
                <td className="p-4 text-zinc-400 text-xs">{tool.strategy}</td>
                <td className="p-4 font-mono text-right">{tool.price} USDC</td>
                <td className="p-4 text-right">{tool.callsToday.toLocaleString()}</td>
                <td className="p-4 font-mono text-right">{tool.earnedToday} USDC</td>
                <td className="p-4">
                  <StatusBadge status={tool.active ? "active" : "inactive"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
