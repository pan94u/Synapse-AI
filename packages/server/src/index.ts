import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3001;

const { app } = await createApp();

export default {
  port,
  fetch: app.fetch,
};

console.log(`Synapse API server running on http://localhost:${port}`);
