import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { scheduleCampaign } from '../services/emailService';
import { query } from '../config/db';

export const listCampaigns = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const result = await query('SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getSummary = async (req: Request, res: Response) => {
    try {
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
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getCampaignEmails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM emails WHERE campaign_id = $1 ORDER BY created_at ASC', [id]);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getCampaignStats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT status, count(*) 
       FROM emails 
       WHERE campaign_id = $1 
       GROUP BY status`,
            [id]
        );
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req.user as any).id;
        const result = await query('SELECT * FROM emails WHERE id = $1 AND user_id = $2', [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const schedule = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { senderId, name, subject, body, startTime, delayBetweenMs, hourlyLimit } = req.body;

        let recipients: string[] = [];

        if (req.file) {
            const records = parse((req.file as any).buffer, {
                columns: false,
                skip_empty_lines: true,
                trim: true
            });
            recipients = records
                .map((r: any) => r[0])
                .filter((email: any) => {
                    if (typeof email !== 'string') return false;
                    const e = email.trim();
                    const lower = e.toLowerCase();
                    return lower !== 'email' && lower !== 'emails' && e.includes('@');
                })
                .map((e: string) => e.trim());
        } else if (req.body.recipients) {
            recipients = Array.isArray(req.body.recipients) ? req.body.recipients : [req.body.recipients];
        }

        if (recipients.length === 0) {
            return res.status(400).json({ error: 'No recipients provided' });
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
    } catch (err: any) {
        console.error('Scheduling error:', err);
        res.status(500).json({ error: err.message });
    }
};

export default {
    listCampaigns,
    getSummary,
    getCampaignEmails,
    getCampaignStats,
    getEmail,
    schedule,
};
