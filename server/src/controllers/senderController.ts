import { Request, Response } from 'express';
import { query } from '../config/db';

export const getSenders = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const result = await query('SELECT * FROM senders WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createSender = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { email, name, provider = 'ethereal' } = req.body;

        const result = await query(
            `INSERT INTO senders (user_id, email, name, provider) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [userId, email, name, provider]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export default { getSenders, createSender };
