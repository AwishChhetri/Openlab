import { Request, Response } from 'express';
import { query } from '../config/db';
import { asyncHandler } from '../utils/errors';

export const getSenders = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const result = await query('SELECT * FROM senders WHERE user_id = $1', [userId]);
    res.json(result.rows);
});

export const createSender = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const { email, name, provider = 'ethereal' } = req.body;

    const result = await query(
        `INSERT INTO senders (user_id, email, name, provider) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [userId, email, name, provider]
    );

    res.status(201).json(result.rows[0]);
});

export default { getSenders, createSender };
