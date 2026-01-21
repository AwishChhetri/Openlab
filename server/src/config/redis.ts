import { Redis, RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Support both URL-based (Railway) and host/port-based (local) Redis connections
const createRedisConfig = (): RedisOptions | string => {
    // If REDIS_URL is provided (Railway, Render, etc.), use it directly
    if (process.env.REDIS_URL) {
        console.log('[Redis] Using REDIS_URL connection');
        return process.env.REDIS_URL;
    }

    // Otherwise, use host/port/password configuration
    console.log('[Redis] Using host/port configuration:', {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || '6379',
        hasPassword: !!process.env.REDIS_PASSWORD
    });

    const config: RedisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
    };

    // Add password if provided
    if (process.env.REDIS_PASSWORD) {
        config.password = process.env.REDIS_PASSWORD;
    }

    return config;
};

const redisConfig = createRedisConfig();

// Connection for BullMQ (needs maxRetriesPerRequest: null)
export const createRedisConnection = () => {
    if (typeof redisConfig === 'string') {
        // URL-based connection
        const redis = new Redis(redisConfig);
        redis.options.maxRetriesPerRequest = null;
        return redis;
    } else {
        // Options-based connection (already has maxRetriesPerRequest set)
        return new Redis(redisConfig);
    }
};

// General purpose Redis connection (caching, rate limiting)
const createClient = () => {
    if (typeof redisConfig === 'string') {
        const client = new Redis(redisConfig);
        client.options.maxRetriesPerRequest = null;
        return client;
    } else {
        return new Redis(redisConfig);
    }
};

export const redisClient = createClient();

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
