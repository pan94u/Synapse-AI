import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3001;

const { app, hub, proactiveManager, decisionEngine, skillManager: _skillManager, browserPool } = await createApp();

// Graceful shutdown
const shutdown = async () => {
  console.log('[server] Shutting down...');
  decisionEngine?.stop();
  proactiveManager?.stop();
  await browserPool?.shutdown();
  hub?.stop();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 120, // 120 seconds — needed for SSE streams during long-running skill/proactive executions
};

console.log(`Synapse API server running on http://localhost:${port}`);
