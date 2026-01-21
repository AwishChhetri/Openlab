import { query, getClient } from '../config/db';
import { addEmailJob } from '../jobs/emailQueue';

interface ScheduleRequest {
    userId: string;
    senderId: string;
    campaignName: string;
    subject: string;
    body: string;
    recipients: string[]; // List of email addresses
    startTime: Date;
    delayBetweenMs: number;
    hourlyLimit: number;
}

export const scheduleCampaign = async (data: ScheduleRequest) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // 1. Create Campaign
        const campaignResult = await client.query(
            'INSERT INTO campaigns (user_id, name, status, hourly_limit) VALUES ($1, $2, $3, $4) RETURNING id',
            [data.userId, data.campaignName, 'PROCESSING', data.hourlyLimit]
        );
        const campaignId = campaignResult.rows[0].id;

        const startTimeMs = new Date(data.startTime).getTime();
        const nowMs = Date.now();
        const initialDelay = Math.max(0, startTimeMs - nowMs);

        // 2. Prepare Email Queries and Jobs
        const jobs = [];
        for (let i = 0; i < data.recipients.length; i++) {
            const recipient = data.recipients[i];
            const individualDelay = initialDelay + (i * data.delayBetweenMs);
            const scheduledAt = new Date(nowMs + individualDelay);

            // Create Email Record
            const emailResult = await client.query(
                `INSERT INTO emails (user_id, campaign_id, sender_id, recipient, subject, body, status, scheduled_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [data.userId, campaignId, data.senderId, recipient, data.subject, data.body, 'SCHEDULED', scheduledAt]
            );

            const emailId = emailResult.rows[0].id;

            // Add to BullMQ
            jobs.push(addEmailJob(emailId, individualDelay));
        }

        await Promise.all(jobs);
        await client.query('COMMIT');

        return { campaignId, count: data.recipients.length };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
