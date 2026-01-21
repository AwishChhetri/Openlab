import { runMigrations } from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

runMigrations().then(() => {
    console.log('Done');
    process.exit(0);
}).catch((err: any) => {
    console.error(err);
    process.exit(1);
});