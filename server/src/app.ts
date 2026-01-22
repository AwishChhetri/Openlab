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
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP to avoid blocking cross-domain AJAX/OAuth
}));

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://emails.up.railway.app',
    'https://openlab-nine.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(o => o === origin) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.up.railway.app');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejected origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Session
// Force production flags if on Railway/Render even if NODE_ENV is missing
const isProductionDomain = process.env.RAILWAY_STATIC_URL || process.env.RENDER_EXTERNAL_URL || process.env.NODE_ENV === 'production';

console.log(`[Session] Configured for ${isProductionDomain ? 'Production' : 'Development'} mode`);

app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: !!isProductionDomain,
        sameSite: isProductionDomain ? 'none' : 'lax',
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
