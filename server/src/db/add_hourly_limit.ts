import { query } from '../config/db';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    try {
        await query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS hourly_limit INT;');
        console.log('Migration successful: added hourly_limit to campaigns');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
