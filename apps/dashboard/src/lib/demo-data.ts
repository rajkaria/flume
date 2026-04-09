export const recentTransactions = [
  { id: "1", toolId: "search", caller: "0x1a2b...3c4d", amount: "0.005000", status: "validated" as const, time: "2m ago" },
  { id: "2", toolId: "analyze", caller: "0x5e6f...7g8h", amount: "0.010000", status: "validated" as const, time: "5m ago" },
  { id: "3", toolId: "search", caller: "0x9i0j...1k2l", amount: "0.005000", status: "rejected" as const, time: "8m ago" },
  { id: "4", toolId: "summarize", caller: "0x3m4n...5o6p", amount: "0.008000", status: "validated" as const, time: "12m ago" },
  { id: "5", toolId: "search", caller: "0x7q8r...9s0t", amount: "0.005000", status: "settled" as const, time: "15m ago" },
  { id: "6", toolId: "translate", caller: "0x1a2b...3c4d", amount: "0.003000", status: "validated" as const, time: "20m ago" },
  { id: "7", toolId: "analyze", caller: "0x5e6f...7g8h", amount: "0.010000", status: "validated" as const, time: "25m ago" },
  { id: "8", toolId: "search", caller: "0xab12...cd34", amount: "0.005000", status: "pending" as const, time: "30m ago" },
];

export const tools = [
  { toolId: "search", name: "Web Search", protocol: "x402", price: "0.005000", callsToday: 342, earnedToday: "1.710000", active: true, strategy: "static" },
  { toolId: "analyze", name: "Data Analyzer", protocol: "x402", price: "0.010000", callsToday: 128, earnedToday: "1.280000", active: true, strategy: "demand" },
  { toolId: "summarize", name: "Summarizer", protocol: "x402", price: "0.008000", callsToday: 95, earnedToday: "0.760000", active: true, strategy: "tiered" },
  { toolId: "translate", name: "Translator", protocol: "x402", price: "0.003000", callsToday: 210, earnedToday: "0.630000", active: true, strategy: "static" },
  { toolId: "classify", name: "Classifier", protocol: "free", price: "0.000000", callsToday: 500, earnedToday: "0.000000", active: false, strategy: "static" },
];

export const revenueData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  revenue: parseFloat((Math.random() * 0.5 + 0.1).toFixed(3)),
  calls: Math.floor(Math.random() * 50 + 10),
}));

export const settlements = [
  { batchId: "batch-1712620800", arcTxHash: "0xabc1...def1", toolCount: 4, totalAmount: "12.450000", timestamp: "2026-04-09T04:00:00Z" },
  { batchId: "batch-1712617200", arcTxHash: "0xabc2...def2", toolCount: 3, totalAmount: "8.230000", timestamp: "2026-04-09T03:00:00Z" },
  { batchId: "batch-1712613600", arcTxHash: "0xabc3...def3", toolCount: 4, totalAmount: "15.100000", timestamp: "2026-04-09T02:00:00Z" },
];

export const topCallers = [
  { wallet: "0x1a2b...3c4d", totalSpent: "45.230000", callCount: 892 },
  { wallet: "0x5e6f...7g8h", totalSpent: "32.100000", callCount: 641 },
  { wallet: "0x9i0j...1k2l", totalSpent: "28.550000", callCount: 570 },
  { wallet: "0x3m4n...5o6p", totalSpent: "21.800000", callCount: 435 },
  { wallet: "0xab12...cd34", totalSpent: "18.920000", callCount: 378 },
];
