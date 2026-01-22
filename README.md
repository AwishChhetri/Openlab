# Openlab

This repository contains a production-oriented email scheduling service + dashboard.

## Key Features
- **Campaign Scheduling**: Store in Postgres and enqueue delayed jobs in BullMQ (Redis).
- **Rate Limiting**: Per-sender hourly limits using Redis atomic counters.
- **Resilient Workers**: BullMQ delayed jobs survive worker restarts.
- **Modern UI**: React + TypeScript frontend with Google OAuth and Rich Text Editor.

## Architecture Overview
1. **Frontend**: React + Vite + Tailwind.
2. **Backend**: Node.js + Express.
3. **Database**: PostgreSQL (Prisma-like raw queries).
4. **Queue**: BullMQ with Redis for background tasks.
5. **Worker**: Separate process for processing email sends and enforcing rate limits.

## Quickstart (Local)

1. **Start Infrastructure**:
   ```bash
   cd server && docker-compose up -d
   ```

2. **Environment Setup**:
   Copy `server/.env.example` to `server/.env` and fill in:
   - `DATABASE_URL` (Port 5433 for local docker)
   - `REDIS_URL` or `REDIS_HOST/PORT`
   - `GOOGLE_OAUTH` credentials
   - `ETHEREAL` credentials for test sending

3. **Install & Run**:
   ```bash
   # Server
   npm install && npm run migrate && npm run dev
   
   # Worker (Separate terminal)
   npm run worker
   
   # Frontend (Separate terminal)
   cd client && npm install && npm run dev
   ```

## Deployment (Railway)

The project is optimized for [Railway](https://railway.app). 

1. **Connect Repository**: Point Railway to your GitHub fork.
2. **Postgres & Redis**: Add Postgres and Redis plugins from the Railway dashboard.
3. **Automated Setup**: The `railway.json` file handles the multi-service build and deployment of both the API and the Worker.

## Deployment (Vercel)

The frontend can be deployed to [Vercel](https://vercel.com).

1. **Root Directory**: In Vercel Project Settings, set **Root Directory** to `client`.
2. **Framework Preset**: Ensure it is set to **Vite**.
3. **Environment Variables**: Set `VITE_API_URL` to `https://emails.up.railway.app`.

## Verification Checklist
- [x] Local builds passing (`npm run build`)
- [x] Docker services healthy
- [x] OAuth flow functional
- [x] Worker processing enqueued emails
- [x] Rate limiting correctly delaying sends

---
Developed as a production-grade assignment for Openlab.
