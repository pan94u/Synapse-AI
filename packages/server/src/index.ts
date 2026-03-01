import app from './app.js';

const port = Number(process.env.PORT) || 3001;

export default {
  port,
  fetch: app.fetch,
};

console.log(`Synapse API server running on http://localhost:${port}`);
