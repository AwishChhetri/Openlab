import { Redis, RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Support both URL-based (Railway) and host/port-based (local) Redis connections
const createRedisConfig = (): RedisOptions | string => {
    // If REDIS_URL is provided (Railway, Render, etc.), use it directly
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    // Otherwise, use host/port configuration (local development)
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
    };
};

const redisConfig = createRedisConfig();

// Connection for BullMQ (needs maxRetriesPerRequest: null)
export const createRedisConnection = () => {
    const redis = new Redis(redisConfig);
    if (typeof redisConfig === 'string') {
        // For URL-based connections, set maxRetriesPerRequest after creation
        redis.options.maxRetriesPerRequest = null;
    }
    return redis;
};

// General purpose Redis connection (caching, rate limiting)
export const redisClient = new Redis(redisConfig);
if (typeof redisConfig === 'string') {
    redisClient.options.maxRetriesPerRequest = null;
}

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
