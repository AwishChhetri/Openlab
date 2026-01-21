import { Redis, RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
};

// Connection for BullMQ (needs maxRetriesPerRequest: null)
export const createRedisConnection = () => new Redis(redisConfig);

// General purpose Redis connection (caching, rate limiting)
export const redisClient = new Redis(redisConfig);

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
