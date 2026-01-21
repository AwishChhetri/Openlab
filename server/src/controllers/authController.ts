import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import passport from 'passport';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userResult = await query(
            `INSERT INTO users (email, name, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, email, name, avatar_url, created_at`,
            [email, name, passwordHash]
        );

        const user = userResult.rows[0];

        await query(
            `INSERT INTO senders (user_id, email, name, provider)
             VALUES ($1, $2, $3, 'ethereal')`,
            [user.id, email, name]
        );

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Registration successful but login failed' });
            }
            res.status(201).json({ message: 'User registered successfully', user });
        });
    } catch (err: any) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const login = (req: Request, res: Response, next: any) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: info?.message || 'Invalid credentials' });
        }
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }
            res.json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } });
        });
    })(req, res, next);
};

export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleCallback = (
    req: Request,
    res: Response,
    next: any
) => {
    passport.authenticate('google', { failureRedirect: '/login' })(req, res, () => {
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/dashboard');
    });
};

export const logout = (req: Request, res: Response, next: any) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/');
    });
};

export const me = (req: Request, res: Response) => {
    res.json(req.user || null);
};

export default {
    register,
    login,
    googleAuth,
    googleCallback,
    logout,
    me,
};
