import { Request, Response } from 'express';
import passport from 'passport';
import { registerUser } from '../services/authService';
import { asyncHandler } from '../utils/errors';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, password, and name are required' });
        return;
    }

    const user = await registerUser({ email, password, name });

    req.login(user, (err) => {
        if (err) {
            res.status(201).json({ message: 'User registered, but auto-login failed. Please login manually.', user });
            return;
        }
        res.status(201).json({ message: 'User registered successfully', user });
    });
});

export const login = (req: Request, res: Response, next: any) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) {
            res.status(401).json({ error: info?.message || 'Invalid credentials' });
            return;
        }
        req.login(user, (err) => {
            if (err) return next(err);
            res.json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } });
        });
    })(req, res, next);
};

export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleCallback = (req: Request, res: Response, next: any) => {
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
