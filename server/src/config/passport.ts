import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { localStrategy } from './local.strategy';
import { query } from './db';
import dotenv from 'dotenv';

dotenv.config();

// Configure Local Strategy
passport.use(localStrategy);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const { id, emails, displayName, photos } = profile;
                const email = emails?.[0].value;
                const avatarUrl = photos?.[0].value;

                // Upsert user
                const userResult = await query(
                    `INSERT INTO users (google_id, email, name, avatar_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (google_id) 
           DO UPDATE SET name = $3, avatar_url = $4
           RETURNING *`,
                    [id, email, displayName, avatarUrl]
                );

                const user = userResult.rows[0];

                // Upsert default sender for this user
                await query(
                    `INSERT INTO senders (user_id, email, name, provider)
           VALUES ($1, $2, $3, 'ethereal')
           ON CONFLICT (user_id, email) DO NOTHING`,
                    [user.id, email, displayName]
                );

                return done(null, user);
            } catch (err) {
                return done(err as Error);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});

export default passport;
