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

/* -------------------- Redis Session Store -------------------- */
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
});

/* -------------------- Security / Proxy -------------------- */
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://emails.up.railway.app',
  'https://openlab-nine.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.up.railway.app');

    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
};

/* 🔑 PRE-FLIGHT FIX */
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

/* -------------------- Session -------------------- */
const isProduction =
  !!process.env.RAILWAY_STATIC_URL ||
  !!process.env.RAILWAY_PUBLIC_DOMAIN ||
  !!process.env.RENDER_EXTERNAL_URL ||
  process.env.NODE_ENV === 'production';

console.log(`[Session] ${isProduction ? 'Production' : 'Development'} mode`);

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* -------------------- Auth -------------------- */
app.use(passport.initialize());
app.use(passport.session());

/* -------------------- Routes -------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/campaigns', campaignRoutes);

/* -------------------- Health -------------------- */
app.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbRes = await query('SELECT NOW()');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbRes.rows?.length ? 'connected' : 'disconnected',
    });
  })
);

/* -------------------- Error Handler -------------------- */
app.use(errorHandler);

export default app;
