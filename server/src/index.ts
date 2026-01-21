import dotenv from 'dotenv';
import app from './app';
import { runMigrations } from './config/db';

dotenv.config();

const startServer = async () => {
    try {
        // Run migrations on every startup/deploy
        await runMigrations();

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error('[server]: Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
