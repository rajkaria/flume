import express from 'express';
import { flumeMiddleware, loadConfig } from '@flume/gateway';

const app = express();
app.use(express.json());

const config = loadConfig('./flume.config.json');
app.use(flumeMiddleware(config));

// Free tool — no payment required
app.post('/tools/ping', (_req, res) => {
  res.json({ result: 'pong', timestamp: Date.now() });
});

// Paid tool — static price $0.005
app.post('/tools/search', (req, res) => {
  const query = (req.body as { query?: string }).query ?? 'default';
  res.json({
    results: [
      { title: `Result for "${query}"`, url: 'https://example.com/1' },
      { title: `Another result for "${query}"`, url: 'https://example.com/2' },
    ],
  });
});

// Paid tool — demand-based pricing
app.post('/tools/analyze', (req, res) => {
  const data = (req.body as { data?: string }).data ?? '';
  res.json({
    analysis: {
      wordCount: data.split(' ').length,
      sentiment: 'positive',
      summary: `Analysis of ${data.slice(0, 50)}...`,
    },
  });
});

const port = parseInt(process.env.PORT ?? '3000', 10);
app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
  console.log(`Tools: search ($0.005), analyze (demand-based), ping (free)`);
});
