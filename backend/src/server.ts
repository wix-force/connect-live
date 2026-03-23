import http from 'http';
import app from './app';
import { config } from './config';
import { connectDB } from './config/database';
import { initSocketServer } from './sockets';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

const start = async () => {
  await connectDB();

  server.listen(config.port, () => {
    logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
    logger.info(`📡 WebSocket server ready`);
    logger.info(`🔗 Client URL: ${config.client.url}`);
  });
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  shutdown();
});

start();
