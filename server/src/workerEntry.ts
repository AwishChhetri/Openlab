import dotenv from 'dotenv';
import { initWorker } from './jobs/emailWorker';
import { createRedisConnection } from './config/redis';

dotenv.config();

console.log('Starting Email Worker...');

const worker = initWorker();

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down worker...');
    await worker.close();
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('Worker is running!');
