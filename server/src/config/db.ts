import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();

export const runMigrations = async () => {
    console.log('[DB] Starting migrations...');
    const client = await pool.connect();
    try {
        // Try multiple possible paths for schema.sql
        const possiblePaths = [
            path.join(__dirname, '..', 'db', 'schema.sql'),
            path.join(process.cwd(), 'src', 'db', 'schema.sql'),
            path.join(process.cwd(), 'dist', 'db', 'schema.sql')
        ];

        let schemaSql = '';
        let foundPath = '';

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                schemaSql = fs.readFileSync(p, 'utf8');
                foundPath = p;
                break;
            }
        }

        if (!schemaSql) {
            throw new Error(`Could not find schema.sql in any of: ${possiblePaths.join(', ')}`);
        }

        console.log(`[DB] Using schema from: ${foundPath}`);
        await client.query('BEGIN');
        await client.query(schemaSql);
        await client.query('COMMIT');
        console.log('[DB] Migrations completed successfully');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('[DB] Migration failed:', err);
        throw err;
    } finally {
        client.release();
    }
};

export default pool;
