export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-violet-400">Flume</span>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#packages" className="hover:text-white transition-colors">Packages</a>
            <a href="#pricing-strategies" className="hover:text-white transition-colors">Pricing</a>
            <a href="/overview" className="hover:text-white transition-colors">Dashboard</a>
            <a href="https://github.com/rajkaria/flume" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full">
            Built on Circle Nanopayments + Arc
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            The payment infrastructure<br />
            <span className="text-violet-400">for AI agents.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Five packages. Wrap your MCP server. Start earning USDC per call. No gas. No wallets to manage.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <a href="#how" className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition-colors">
              Get started
            </a>
            <a href="https://github.com/rajkaria/flume" className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 rounded-lg font-medium transition-colors">
              View on GitHub
            </a>
          </div>

          {/* Code snippet */}
          <div className="mt-12 max-w-xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left font-mono text-sm">
              <div className="text-zinc-500 mb-2">// 3 lines to monetize your MCP server</div>
              <div><span className="text-violet-400">import</span> {"{"} flumeMiddleware, loadConfig {"}"} <span className="text-violet-400">from</span> <span className="text-green-400">{`'@flume/gateway'`}</span>;</div>
              <div><span className="text-violet-400">const</span> config = <span className="text-blue-400">loadConfig</span>(<span className="text-green-400">{`'./flume.config.json'`}</span>);</div>
              <div>app.<span className="text-blue-400">use</span>(<span className="text-blue-400">flumeMiddleware</span>(config));</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Configure", desc: "Run flume init. Set tool names, prices, and spending policies in one JSON file." },
              { step: "2", title: "Wrap", desc: "One import, one line. Your MCP server or HTTP API is now monetized with x402." },
              { step: "3", title: "Earn", desc: "Agents pay per call in USDC. Dashboard tracks everything. Arc settles every 15 minutes." },
            ].map((item) => (
              <div key={item.step} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Five composable packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "@flume/gateway", desc: "Server middleware. PaymentGate, SpendingPolicy, DynamicPricing, ProtocolBridge.", install: "pnpm add @flume/gateway" },
              { name: "@flume/arc", desc: "Circle + Arc integration. NanopayVerifier, EarningsLedger, WalletManager.", install: "pnpm add @flume/arc" },
              { name: "@flume/sdk", desc: "Agent-side client. FlumeClient, FlumeAggregator, MCP + Vercel AI adapters.", install: "pnpm add @flume/sdk" },
              { name: "@flume/cli", desc: "Developer CLI. flume init, status, audit, wallet, deploy.", install: "pnpm add -g @flume/cli" },
              { name: "@flume/contracts", desc: "Solidity on Arc. FlumeRegistry, EscrowVault, RevenueSplit.", install: "pnpm add @flume/contracts" },
            ].map((pkg) => (
              <div key={pkg.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-mono text-sm text-violet-400 mb-2">{pkg.name}</h3>
                <p className="text-sm text-zinc-400 mb-3">{pkg.desc}</p>
                <code className="text-xs bg-zinc-800 px-2 py-1 rounded font-mono text-zinc-300">{pkg.install}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DynamicPricing */}
      <section id="pricing-strategies" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Six pricing strategies</h2>
          <p className="text-center text-zinc-400 mb-12">Set your pricing in config. No code changes needed.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Static", desc: "Fixed price per call" },
              { name: "Time-of-day", desc: "Peak/off-peak multipliers" },
              { name: "Demand", desc: "Price scales with call volume" },
              { name: "Tiered", desc: "Lower prices for high-volume callers" },
              { name: "A/B Test", desc: "Test price points with deterministic assignment" },
              { name: "Auto-negotiate", desc: "Agents propose, you set the floor" },
            ].map((s) => (
              <div key={s.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-1">{s.name}</h3>
                <p className="text-sm text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Margin proof */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why not just use Stripe?</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-zinc-800">
                  <th className="p-4 font-medium">Method</th>
                  <th className="p-4 font-medium text-right">Cost / 1000 calls</th>
                  <th className="p-4 font-medium text-right">Margin loss</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800">
                  <td className="p-4">Stripe (min $0.30 fee)</td>
                  <td className="p-4 text-right font-mono">$300.00</td>
                  <td className="p-4 text-right text-red-400">99.3%</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4">On-chain (avg $0.05 gas)</td>
                  <td className="p-4 text-right font-mono">$50.00</td>
                  <td className="p-4 text-right text-amber-400">90%</td>
                </tr>
                <tr className="bg-violet-500/5">
                  <td className="p-4 font-medium text-violet-400">Flume + Circle Nanopayments</td>
                  <td className="p-4 text-right font-mono text-violet-400">$1.00</td>
                  <td className="p-4 text-right text-green-400">0.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-lg font-bold text-violet-400">Flume</span>
            <p className="text-xs text-zinc-500 mt-1">Built on Circle Nanopayments + Arc. MIT licensed.</p>
          </div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="https://github.com/rajkaria/flume" className="hover:text-white">GitHub</a>
            <a href="#" className="hover:text-white">Docs</a>
            <a href="#" className="hover:text-white">Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
