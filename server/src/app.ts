import express, { Express, Request, Response } from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { redisClient } from './config/redis';
import helmet from 'helmet';
import cors from 'cors';
import passport from './config/passport';
import { query } from './config/db';
import authRoutes from './routes/authRoutes';
import senderRoutes from './routes/senderRoutes';
import campaignRoutes from './routes/campaignRoutes';
import { errorHandler, asyncHandler } from './utils/errors';

const app: Express = express();

// Initialize RedisStore
const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'sess:'
});

// Security & Proxy
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Session
app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Auth
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/campaigns', campaignRoutes);

// Health check
app.get('/health', asyncHandler(async (req: Request, res: Response) => {
    const dbRes = await query('SELECT NOW()');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: dbRes.rows[0] ? 'connected' : 'disconnected'
    });
}));

// Final Error Handling
app.use(errorHandler);

export default app;
