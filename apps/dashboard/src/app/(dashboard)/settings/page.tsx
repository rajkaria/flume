export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">API Keys</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Production Key</p>
                <p className="font-mono text-xs text-zinc-500">flume_pk_live_...a3b4</p>
              </div>
              <button className="text-xs text-red-400 hover:text-red-300">Revoke</button>
            </div>
            <button className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors">
              + Create New API Key
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Webhooks</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Payment Events</p>
                <p className="font-mono text-xs text-zinc-500">https://api.example.com/flume/webhook</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-violet-400 hover:text-violet-300">Test</button>
                <button className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Settlement</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Settlement Frequency</label>
              <input
                type="range"
                min="15"
                max="60"
                step="15"
                defaultValue="15"
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Settlement Wallet</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue="0xabc1...def1"
                  readOnly
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono"
                />
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Notifications</h3>
          <div className="space-y-3">
            {[
              { label: "Budget exhausted alerts", defaultChecked: true },
              { label: "Policy violation alerts", defaultChecked: true },
              { label: "Settlement confirmations", defaultChecked: false },
              { label: "Daily earning summaries", defaultChecked: false },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg cursor-pointer">
                <span className="text-sm">{item.label}</span>
                <input type="checkbox" defaultChecked={item.defaultChecked} className="accent-violet-500" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
