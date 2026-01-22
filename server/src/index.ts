import dotenv from 'dotenv';
import app from './app';
import { runMigrations } from './config/db';

dotenv.config();

async function startServer() {
  try {
    await runMigrations();

    const port = Number(process.env.PORT);
    if (!port) {
      throw new Error('PORT not provided by environment');
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`[server] running on 0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error('[server] startup failed:', err);
    process.exit(1);
  }
}

startServer();