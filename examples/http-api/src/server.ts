import express from 'express';
import { flumeMiddleware, loadConfig } from '@flume/gateway';

const app = express();
app.use(express.json());

const config = loadConfig('./flume.config.json');
app.use(flumeMiddleware(config));

app.post('/tools/translate', (req, res) => {
  const { text, to } = req.body as { text?: string; to?: string };
  res.json({ translated: `[${to ?? 'en'}] ${text ?? ''}`, language: to ?? 'en' });
});

app.post('/tools/summarize', (req, res) => {
  const { text } = req.body as { text?: string };
  const words = (text ?? '').split(' ');
  res.json({ summary: words.slice(0, Math.min(10, words.length)).join(' ') + '...' });
});

app.listen(3002, () => console.log('HTTP API running on port 3002'));
