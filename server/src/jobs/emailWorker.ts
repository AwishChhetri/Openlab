import { Worker, Job } from 'bullmq';
import { createRedisConnection, redisClient } from '../config/redis';
import { EMAIL_QUEUE_NAME } from './emailQueue';
import { query } from '../config/db';
import nodemailer from 'nodemailer';
import { checkRateLimit } from '../utils/rateLimiter';
import { addEmailJob } from './emailQueue';

// Configure Ethereal transport (or others based on sender)
// In a real app, we'd look up the sender's credentials from the DB
const createTransporter = async () => {
    // For now using env vars for Ethereal, but logic will expand
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.ETHEREAL_APP_EMAIL,
            pass: process.env.ETHEREAL_APP_PASSWORD,
        },
    });
};

const processEmailJob = async (job: Job) => {
    const { emailId } = job.data;
    console.log(`Processing email job ${job.id} for email ${emailId}`);

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
            console.error(`Email ${emailId} not found`);
            return; // Should probably fail job
        }

        const email = emailResult.rows[0];

        // 1.5 Validate Recipient
        if (!email.recipient || !email.recipient.includes('@')) {
            console.error(`Invalid recipient for email ${emailId}: "${email.recipient}"`);
            await query(
                `UPDATE emails SET status = 'FAILED', error_message = 'Invalid recipient' WHERE id = $1`,
                [emailId]
            );
            return; // Exit without throwing to avoid BullMQ retries
        }

        // 2. Check rate limits (Per-sender, using campaign specific limit or default)
        const hourlyLimit = email.hourly_limit || parseInt(process.env.DEFAULT_EMAILS_PER_HOUR || '100');
        const limitCheck = await checkRateLimit(email.sender_id, hourlyLimit);

        if (limitCheck.limited) {
            console.log(`Rate limit reached for sender ${email.sender_id}. Rescheduling email ${emailId}`);
            const delay = limitCheck.nextWindow!.getTime() - Date.now();

            // Adding a small buffer (10s) to ensure we are in the next window
            const uniqueJobId = `${emailId}-retry-${Date.now()}`;
            await addEmailJob(emailId, delay + 10000, uniqueJobId);

            // Mark current job as "rescheduled" (complete it without sending)
            return;
        }

        // 3. Send Email
        const transporter = await createTransporter();

        const info = await transporter.sendMail({
            from: `"${email.sender_name}" <${email.sender_email}>`,
            to: email.recipient,
            subject: email.subject,
            text: email.body, // or html
        });

        console.log(`Email sent: ${info.messageId}`);

        // 4. Update DB status
        await query(
            `UPDATE emails SET 
        status = 'SENT', 
        sent_at = NOW(), 
        message_id = $1 
       WHERE id = $2`,
            [info.messageId, emailId]
        );

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
            console.log(`Campaign ${campaignId} marked as COMPLETED`);
        }

    } catch (error: any) {
        console.error(`Failed to send email ${emailId}:`, error);

        // Update DB with error
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

    worker.on('completed', job => {
        console.log(`Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`Job ${job?.id} failed with ${err.message}`);
    });

    return worker;
};
