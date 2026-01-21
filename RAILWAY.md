# Railway Deployment Guide

This project can be deployed to Railway with separate services for API and Worker.

## Important: Root Directory Configuration

**CRITICAL**: When creating services in Railway, you MUST set the **Root Directory** to `server` in the service settings. This is because the project uses a monorepo structure.

## Quick Setup

### 1. Create Services in Railway Dashboard

Create **4 services** in your Railway project:

1. **PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Note: Railway will auto-generate `DATABASE_URL`

2. **Redis**
   - Click "New" → "Database" → "Redis"
   - Note: Railway will auto-generate connection details

3. **API Service**
   - Click "New" → "GitHub Repo" → Select `Openlab`
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
     REDIS_PORT=6379
     PORT=3000
     NODE_ENV=production
     SESSION_SECRET=<generate-random-string>
     FRONTEND_URL=https://openlab-gzmn.vercel.app
     GOOGLE_CLIENT_ID=<your-google-client-id>
     GOOGLE_CLIENT_SECRET=<your-google-client-secret>
     GOOGLE_CALLBACK_URL=https://<your-api-domain>.railway.app/api/auth/google/callback
     ETHEREAL_APP_EMAIL=<your-ethereal-email>
     ETHEREAL_APP_PASSWORD=<your-ethereal-password>
     ```

4. **Worker Service**
   - Click "New" → "GitHub Repo" → Select `Openlab`
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:worker`
   - **Environment Variables**:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
     REDIS_PORT=6379
     NODE_ENV=production
     ETHEREAL_APP_EMAIL=<your-ethereal-email>
     ETHEREAL_APP_PASSWORD=<your-ethereal-password>
     ```

## Important Notes

- **Root Directory**: Railway needs to know your code is in the `server` folder. Set this in the service settings.
- **Private Networking**: Railway automatically handles service-to-service communication via private domains.
- **Migrations**: The API service will run migrations automatically on startup.

## Troubleshooting

### Build Fails with "Failed to build an image"
- Make sure **Root Directory** is set to `server` in Railway service settings
- Check that the build command includes `cd server` if root directory isn't set
- Verify `package.json` exists in the `server` directory

### Worker Not Processing Jobs
- Verify Redis connection variables are correct
- Check worker logs for connection errors
- Ensure both API and Worker are using the same Redis instance
