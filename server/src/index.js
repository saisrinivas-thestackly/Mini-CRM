import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

async function start() {
  await mongoose.connect(env.MONGO_URI);
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    console.info(`${signal} received, shutting down`);
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
