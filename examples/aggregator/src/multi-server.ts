import { FlumeAggregator } from '@flume/sdk';

const agg = new FlumeAggregator({
  servers: [
    { name: 'server-a', url: process.env.SERVER_A_URL ?? 'http://localhost:3000' },
    { name: 'server-b', url: process.env.SERVER_B_URL ?? 'http://localhost:3002' },
  ],
  strategy: 'cheapest',
  relayUrl: process.env.RELAY_URL ?? 'https://relay.flume.xyz',
  budget: { maxPerCallUsdc: '1.00', maxDailyUsdc: '50.00' },
  walletAddress: '0xAgentWallet',
  privateKey: '0xAgentPrivateKey',
});

async function main() {
  console.log('Aggregator: querying prices across servers...');
  const prices = await agg.queryPrices('search');
  for (const p of prices) {
    console.log(`  ${p.serverName}: ${p.price} USDC (${p.available ? 'available' : 'unavailable'}, ${p.latencyMs}ms)`);
  }

  console.log('\nCalling search with cheapest strategy...');
  try {
    const result = await agg.callTool('search', { query: 'multi-server test' });
    console.log('Result:', result.data);
    console.log(`Paid: ${result.price} USDC via ${result.protocol}`);
  } catch (err) {
    console.error('Call failed:', err);
  }

  const spending = agg.getSpending();
  console.log(`\nTotal: ${spending.totalSpent} USDC across ${spending.callCount} calls`);
  for (const [server, spent] of Object.entries(spending.byServer)) {
    console.log(`  ${server}: ${spent} USDC`);
  }
}

main().catch(console.error);
