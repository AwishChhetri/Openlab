import { query } from '../config/db';
import { redisClient } from '../config/redis';

export const checkRateLimit = async (senderId: string, limit: number) => {
    const now = new Date();
    const hourWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const windowKey = `ratelimit:${senderId}:${hourWindow.getTime()}`;

    // Use Redis for fast atomic increment
    const count = await redisClient.incr(windowKey);

    if (count === 1) {
        // Set expiry to 1 hour + margin
        await redisClient.expire(windowKey, 3600 + 60);
    }

    if (count > limit) {
        return { limited: true, nextWindow: new Date(hourWindow.getTime() + 3600000) };
    }

    // Also sync to DB for persistent tracking (optional/background)
    // To keep it strictly Redis-backed as per requirement

    return { limited: false };
};

export const syncRateLimitToDb = async (senderId: string, count: number) => {
    const now = new Date();
    const hourWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    await query(
        `INSERT INTO hourly_stats (sender_id, hour_window, count)
     VALUES ($1, $2, $3)
     ON CONFLICT (sender_id, hour_window)
     DO UPDATE SET count = hourly_stats.count + 1`,
        [senderId, hourWindow, count]
    );
};
