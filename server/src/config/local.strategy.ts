import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { query } from './db';

export const localStrategy = new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
    },
    async (email, password, done) => {
        try {
            // Find user by email
            const result = await query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            const user = result.rows[0];

            // Check if user has a password (might be Google-only user)
            if (!user.password_hash) {
                return done(null, false, { message: 'Please login with Google' });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
);
