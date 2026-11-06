import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

// Graceful shutdown: stop accepting requests and release DB connections before exiting.
const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
