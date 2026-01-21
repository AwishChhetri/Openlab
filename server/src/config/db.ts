import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();

export const runMigrations = async () => {
    const client = await pool.connect();
    try {
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query('BEGIN');
        await client.query(schemaSql);
        await client.query('COMMIT');
        console.log('Migrations completed successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed', err);
        throw err;
    } finally {
        client.release();
    }
};

export default pool;
