import { Worker, Job } from 'bullmq';
import { createRedisConnection, redisClient } from '../config/redis';
import { EMAIL_QUEUE_NAME } from './emailQueue';
import { query } from '../config/db';
import nodemailer from 'nodemailer';
import { checkRateLimit } from '../utils/rateLimiter';
import { addEmailJob } from './emailQueue';

// Configure Ethereal transport (or others based on sender)
// In a real app, we'd look up the sender's credentials from the DB
// Configure Ethereal transport (or others based on sender)
const createTransporter = async () => {
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.ETHEREAL_APP_EMAIL,
            pass: process.env.ETHEREAL_APP_PASSWORD,
        },
    });
};

const stripHtml = (html: string) =>
    (html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const processEmailJob = async (job: Job) => {
    const { emailId } = job.data;

    try {
        // 1. Fetch email details
        const emailResult = await query(
            `SELECT e.*, s.email as sender_email, s.name as sender_name, c.hourly_limit 
             FROM emails e 
             JOIN senders s ON e.sender_id = s.id 
             JOIN campaigns c ON e.campaign_id = c.id
             WHERE e.id = $1`,
            [emailId]
        );

        if (emailResult.rows.length === 0) {
            console.error(`[Worker] Email ${emailId} not found`);
            return;
        }

        const email = emailResult.rows[0];

        // 1.5 Validate Recipient
        if (!email.recipient || !email.recipient.includes('@')) {
            console.error(`[Worker] Invalid recipient for email ${emailId}: "${email.recipient}"`);
            await query(
                `UPDATE emails SET status = 'FAILED', error_message = 'Invalid recipient' WHERE id = $1`,
                [emailId]
            );
            return;
        }

        // 2. Check rate limits
        const hourlyLimit = email.hourly_limit || parseInt(process.env.DEFAULT_EMAILS_PER_HOUR || '100');
        const limitCheck = await checkRateLimit(email.sender_id, hourlyLimit);

        if (limitCheck.limited) {
            const delay = limitCheck.nextWindow!.getTime() - Date.now();
            console.log(`[Worker] Rate limited. Rescheduling ${emailId} in ${Math.round(delay / 1000)}s`);

            await addEmailJob(emailId, delay + 10000, `${emailId}-retry-${Date.now()}`);
            return;
        }

        // 3. Send Email
        const transporter = await createTransporter();

        const info = await transporter.sendMail({
            from: `"${email.sender_name}" <${email.sender_email}>`,
            to: email.recipient,
            subject: email.subject,
            text: stripHtml(email.body),
            html: email.body,
        });

        // 4. Update DB status
        await query(
            `UPDATE emails SET 
             status = 'SENT', 
             sent_at = NOW(), 
             message_id = $1 
             WHERE id = $2`,
            [info.messageId, emailId]
        );

        console.log(`[Worker] SENT: ${email.recipient} (Job: ${job.id})`);

        // 5. Update Campaign status if all emails are done
        const campaignId = email.campaign_id;
        const remainingResult = await query(
            `SELECT COUNT(*) FROM emails 
             WHERE campaign_id = $1 AND (status = 'PENDING' OR status = 'SCHEDULED')`,
            [campaignId]
        );

        if (parseInt(remainingResult.rows[0].count) === 0) {
            await query(
                `UPDATE campaigns SET status = 'COMPLETED' WHERE id = $1`,
                [campaignId]
            );
            console.log(`[Worker] Campaign ${campaignId} COMPLETED`);
        }

    } catch (error: any) {
        console.error(`[Worker] ERROR: Email ${emailId} failed - ${error.message}`);

        await query(
            `UPDATE emails SET 
             status = 'FAILED', 
             error_message = $1,
             retry_count = retry_count + 1 
             WHERE id = $2`,
            [error.message, emailId]
        );

        throw error; // Let BullMQ handle retry
    }
};


export const initWorker = () => {
    const worker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
        connection: createRedisConnection() as any,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
        limiter: {
            max: parseInt(process.env.DEFAULT_EMAILS_PER_HOUR || '100'),
            duration: 3600000, // 1 hour
        },
    });

    worker.on('failed', (job, err) => {
        // Detailed error for failed jobs is already logged in processEmailJob
    });

    return worker;
};
