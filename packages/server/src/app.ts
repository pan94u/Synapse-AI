import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { chatRoutes } from './routes/chat.js';
import { agentRoutes } from './routes/agent.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api', chatRoutes);
app.route('/api', agentRoutes);

export default app;
