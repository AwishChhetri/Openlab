import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { ApiError } from '../utils/errors';

export interface RegistrationData {
    email: string;
    password: string;
    name: string;
}

/**
 * Handles user registration and initial setup (default sender)
 */
export const registerUser = async (data: RegistrationData) => {
    const { email, password, name } = data;

    // Check existing
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
        throw new ApiError(400, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const userResult = await query(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, avatar_url, created_at`,
        [email, name, passwordHash]
    );

    const user = userResult.rows[0];

    // Setup default Ethereal sender for testing
    await query(
        `INSERT INTO senders (user_id, email, name, provider)
         VALUES ($1, $2, $3, 'ethereal')`,
        [user.id, email, name]
    );

    return user;
};

export default {
    registerUser
};
