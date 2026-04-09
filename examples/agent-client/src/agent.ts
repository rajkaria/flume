import { FlumeClient, FlumeMaxPriceExceededError, FlumeBudgetExhaustedError } from '@flume/sdk';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

const client = new FlumeClient({
  relayUrl: process.env.RELAY_URL ?? 'https://relay.flume.xyz',
  walletAddress: '0xAgentWallet',
  privateKey: '0xAgentPrivateKey',
  budget: {
    maxPerCallUsdc: '0.50',
    maxDailyUsdc: '10.00',
  },
});

async function main() {
  console.log('Agent starting...');
  console.log(`Server: ${SERVER_URL}`);

  // Call free tool
  try {
    const ping = await client.callTool(SERVER_URL, 'ping');
    console.log('Ping:', ping.data, `(${ping.protocol}, ${ping.price} USDC)`);
  } catch (err) {
    console.error('Ping failed:', err);
  }

  // Call paid tool
  try {
    const search = await client.callTool<{ results: unknown[] }>(
      SERVER_URL,
      'search',
      { query: 'AI agent payments' },
    );
    console.log(`Search: ${search.data.results.length} results (${search.price} USDC, ${search.latencyMs}ms)`);
  } catch (err) {
    if (err instanceof FlumeMaxPriceExceededError) {
      console.log(`Search too expensive: ${err.price} > ${err.maxPrice}`);
    } else if (err instanceof FlumeBudgetExhaustedError) {
      console.log(`Budget exhausted: ${err.spent} / ${err.budget}`);
    } else {
      console.error('Search failed:', err);
    }
  }

  // Show spending
  const state = client.getSpendingState();
  console.log(`\nSpending: ${state.totalSpent} USDC across ${state.callCount} calls`);
}

main().catch(console.error);
