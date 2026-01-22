import { Request, Response } from 'express';
import { scheduleCampaign } from '../services/emailService';
import { query } from '../config/db';
import { parseRecipientCsv } from '../utils/csv';
import { asyncHandler } from '../utils/errors';

export const listCampaigns = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const result = await query('SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const result = await query(
        `SELECT 
            COUNT(*) FILTER (WHERE status = 'SENT') as sent,
            COUNT(*) FILTER (WHERE status = 'PENDING' OR status = 'SCHEDULED') as scheduled,
            COUNT(*) FILTER (WHERE status = 'FAILED') as failed
        FROM emails 
        WHERE user_id = $1`,
        [userId]
    );
    res.json(result.rows[0]);
});

export const getCampaignEmails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await query('SELECT * FROM emails WHERE campaign_id = $1 ORDER BY created_at ASC', [id]);
    res.json(result.rows);
});

export const getCampaignStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await query(
        `SELECT status, count(*) 
        FROM emails 
        WHERE campaign_id = $1 
        GROUP BY status`,
        [id]
    );
    res.json(result.rows);
});

export const getEmail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req.user as any).id;
    const result = await query('SELECT * FROM emails WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
        res.status(404).json({ error: 'Email not found' });
        return;
    }
    res.json(result.rows[0]);
});

export const schedule = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const { senderId, name, subject, body, startTime, delayBetweenMs, hourlyLimit } = req.body;

    let recipients: string[] = [];

    if (req.file) {
        recipients = parseRecipientCsv((req.file as any).buffer);
    } else if (req.body.recipients) {
        recipients = Array.isArray(req.body.recipients) ? req.body.recipients : [req.body.recipients];
    }

    if (recipients.length === 0) {
        res.status(400).json({ error: 'No recipients provided' });
        return;
    }

    const result = await scheduleCampaign({
        userId,
        senderId,
        campaignName: name,
        subject,
        body,
        recipients,
        startTime: new Date(startTime),
        delayBetweenMs: parseInt(delayBetweenMs || '0'),
        hourlyLimit: parseInt(hourlyLimit || '0')
    });

    res.status(202).json({ message: 'Campaign scheduled', ...result });
});

export default {
    listCampaigns,
    getSummary,
    getCampaignEmails,
    getCampaignStats,
    getEmail,
    schedule,
};
