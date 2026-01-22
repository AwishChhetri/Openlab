import dotenv from 'dotenv';
import app from './app';
import { runMigrations } from './config/db';

dotenv.config();

const startServer = async () => {
    try {
        // Run migrations on every startup/deploy
        await runMigrations();

        const port = process.env.PORT || 3000;
        app.listen(port, '0.0.0.0', () => {
            console.log(`[server]: Server running on 0.0.0.0:${port}`);
        });
    } catch (err) {
        console.error('[server]: Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
