import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3001;

const { app, hub, proactiveManager, decisionEngine } = await createApp();

// Graceful shutdown
const shutdown = () => {
  console.log('[server] Shutting down...');
  decisionEngine?.stop();
  proactiveManager?.stop();
  hub?.stop();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default {
  port,
  fetch: app.fetch,
};

console.log(`Synapse API server running on http://localhost:${port}`);
