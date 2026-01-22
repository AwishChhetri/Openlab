import { Request, Response, NextFunction } from 'express';

/**
 * Standard API Error Class
 */
export class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Wrap async controller functions to eliminate try-catch boilerplate
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global Error Middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (process.env.NODE_ENV !== 'production' || statusCode === 500) {
        console.error(`[Error] ${req.method} ${req.url}:`, err);
    }

    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
