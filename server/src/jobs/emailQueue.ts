import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-sending';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: createRedisConnection() as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 1000, 
        removeOnFail: 5000,
    },
});

export const addEmailJob = async (emailId: string, delay?: number, jobId?: string) => {
    return emailQueue.add(
        'send-email',
        { emailId },
        {
            delay: delay || 0,
            jobId: jobId || emailId 
        }
    );
};
