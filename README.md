# ReachInbox 

This repository contains a production-oriented email scheduling service + dashboard implemented as the ReachInbox assignment deliverable.

It demonstrates:
- Scheduling email campaigns (store in Postgres) and enqueueing delayed jobs in BullMQ (Redis).
- Sending email using Ethereal (test SMTP) and support for per-sender SMTP credentials.
- Rate limiting (per-sender hourly limits) using Redis atomic counters and rescheduling when the limit is reached.
- Worker concurrency and resilience: BullMQ delayed jobs survive worker restarts; DB stores email state so jobs are not duplicated.
- React + TypeScript frontend with Google OAuth login, campaign compose, scheduled & sent views.

This README documents architecture, how to run locally, environment variables, design choices, and verification steps.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Components & Files](#key-components--files)
- [Local Development (quickstart)](#local-development-quickstart)
- [Environment Variables](#environment-variables)
- [Database / Migrations](#database--migrations)
- [How Scheduling Works (detailed)](#how-scheduling-works-detailed)
- [Persistence & Idempotency Guarantees](#persistence--idempotency-guarantees)
- [Rate Limiting & Concurrency Behavior](#rate-limiting--concurrency-behavior)
- [Frontend Overview & OAuth](#frontend-overview--oauth)
- [Testing & Manual Smoke Test](#testing--manual-smoke-test)
- [Operational Notes & Production Considerations](#operational-notes--production-considerations)
- [Assumptions, Trade-offs & Next Steps](#assumptions-trade-offs--next-steps)

---

## Architecture Overview

High-level flow:

1. User composes a campaign in the frontend and uploads a CSV or enters recipients.
2. Frontend calls the backend API (`/api/campaigns/schedule`).
3. Backend writes a `campaign` and one `emails` row per recipient into Postgres, marking each email `SCHEDULED` and storing `scheduled_at`.
4. Backend enqueues a BullMQ delayed job for each email with a deterministic jobId tied to the email id.
5. A separate worker process (BullMQ Worker) picks up jobs when their delay expires and processes them:
   - Atomically claims the email row (sets `status='SENDING'` only if status is `SCHEDULED`/`PENDING`).
   - Checks per-sender rate limits using Redis `INCR` on a keyed hour window.
   - If rate limit exceeded, the job is rescheduled into the next hour window and `scheduled_at` updated.
   - Otherwise, it sends email via Nodemailer (per-sender SMTP credentials if available; falls back to Ethereal env creds), updates `emails` row to `SENT` and records `message_id`.
6. UI reads `campaigns` and `emails` to show scheduled and sent lists.

Persistence:
- Jobs: BullMQ (Redis) stores delayed jobs; they persist across worker restarts (subject to Redis durability).
- Records: Postgres stores canonical email state (SCHEDULED, SENDING, SENT, FAILED) so duplicate sends can be prevented.

---

## Key Components & Files

- Backend (server):
  - [server/src/app.ts](server/src/app.ts) — Express app and route mounting.
  - [server/src/routes](server/src/routes) — route definitions (thin) delegating to controllers.
  - [server/src/controllers](server/src/controllers) — business logic moved from routes.
  - [server/src/services/emailService.ts](server/src/services/emailService.ts) — scheduling logic that writes DB and enqueues jobs.
  - [server/src/jobs/emailQueue.ts](server/src/jobs/emailQueue.ts) — BullMQ queue creation and `addEmailJob` helper.
  - [server/src/jobs/emailWorker.ts](server/src/jobs/emailWorker.ts) — BullMQ worker that processes jobs, claims rows, enforces rate limits, and sends mail.
  - [server/src/config/redis.ts](server/src/config/redis.ts) — Redis connections.
  - [server/src/config/db.ts](server/src/config/db.ts) — Postgres pool and `runMigrations()` helper.
  - [server/src/db/schema.sql](server/src/db/schema.sql) — schema for `users, senders, campaigns, emails, hourly_stats`.

- Frontend (client):
  - [client/src/pages/Login.tsx](client/src/pages/Login.tsx) — Google login + email login UI.
  - [client/src/pages/Compose.tsx](client/src/pages/Compose.tsx) — compose modal/page with CSV parsing and scheduling options.
  - [client/src/pages/Dashboard.tsx](client/src/pages/Dashboard.tsx) — scheduled/sent lists.

- Infra / Setup:
  - [server/docker-compose.yml](server/docker-compose.yml) — Compose file for Postgres and Redis (local testing).

---

## Local Development (Quickstart)

Prerequisites: Node 18+, Docker (for Postgres & Redis).

1. **Start Services** (from `server/`):
```bash
cd server
docker-compose up -d
```

2. **Setup Environment**:
   - Create `server/.env` based on `.env.example`.
   - Ensure `DATABASE_URL` uses port **5433**.

3. **Install & Initialize** (from `server/`):
```bash
npm install
npm run migrate
npm run build
```

4. **Start Application**:
```bash
npm start
```

5. **Start Worker** (separate terminal):
```bash
npm run worker
```

6. **Start Frontend** (separate terminal):
```bash
cd client
npm install
npm run dev
```

### Troubleshooting: Port 3000 busy (EADDRINUSE)
If you see `Error: listen EADDRINUSE: address already in use :::3000`, run:
```bash
sudo lsof -t -i:3000 | xargs -r sudo kill -9
```
Then try `npm start` again.

---

## Environment Variables

Create `server/.env` with these keys (example values shown):

```
# Database
DATABASE_URL=postgres://user:password@localhost:5433/email_scheduler # Match docker-compose port

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Session / App
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:5173
PORT=3000

# Ethereal (create a test account at https://ethereal.email)
ETHEREAL_APP_EMAIL=ethereal_user
ETHEREAL_APP_PASSWORD=ethereal_pass
ETHEREAL_SMTP_HOST=smtp.ethereal.email
ETHEREAL_SMTP_PORT=587

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Worker / rate limits
WORKER_CONCURRENCY=5
DEFAULT_EMAILS_PER_HOUR=100
RATELIMIT_SYNC_INTERVAL_MS=60000
DEADLETTER_POLL_MS=30000
```

Notes:
- Port and DB host/port should match `server/docker-compose.yml` if you use it.
- `ETHEREAL_*` are only for testing; in production you'll use real SMTP providers per sender.

---

## Database / Migrations

- The base schema is in [server/src/db/schema.sql](server/src/db/schema.sql). Run it to create required tables.
- There are helper migration scripts under `server/src/db` (e.g., `add_hourly_limit.ts`) — run them when needed.

Important tables:
- `users` — application users (Google-linked or local).
- `senders` — per-user senders (provider, credentials JSONB).
- `campaigns` — campaign metadata and `hourly_limit` per campaign.
- `emails` — one row per recipient with `status`, `scheduled_at`, `sent_at`, and `retry_count`.
- `hourly_stats` — optional persisted counters for auditing rate limits.

---

## How Scheduling Works (detailed)

1. On schedule request (see `server/src/services/emailService.ts`):
   - Create a campaign row in `campaigns`.
   - For each recipient, insert an `emails` row with status `SCHEDULED` and a `scheduled_at` timestamp.
   - For each email, compute delay = max(0, startTime - now) + (index * delayBetweenMs) to enforce per-email spacing.
   - Add a BullMQ delayed job (`emailQueue.add`) with payload `{ emailId }` and a deterministic jobId derived from email id (so repeated scheduling attempts don't produce duplicates).

2. Worker (`server/src/jobs/emailWorker.ts`) processes jobs:
   - Loads email + sender + campaign data.
   - Checks rate limit using Redis atomic `INCR` on `ratelimit:<senderId>:<hourWindowMs>`.
     - If over limit: reschedule the job into next window (re-add delayed job), update `scheduled_at` in DB; do not drop the job.
   - Atomically claim email: `UPDATE emails SET status = 'SENDING' WHERE id=$1 AND status IN ('SCHEDULED','PENDING') RETURNING *`.
     - If no row returned, worker skips send (prevents duplicates).
   - Sends via Nodemailer using per-sender credentials if present (stored at `senders.credentials`), otherwise falls back to global Ethereal.
   - On success: `UPDATE emails SET status='SENT', sent_at=NOW(), message_id=?`.
   - On failure: increment retry_count, set status `FAILED` and rethrow to let BullMQ handle retries according to `defaultJobOptions`.

---

## Persistence & Idempotency Guarantees

The system is designed with these guarantees in mind:

- Durable scheduled jobs: BullMQ stores delayed jobs in Redis; if the worker or API restarts, BullMQ + Redis deliver jobs at their scheduled time.
- Canonical state in Postgres: The `emails` table is the source of truth. The worker claims rows atomically before sending to avoid double-sends.
- Deterministic job IDs: `addEmailJob` uses the email id as the jobId so duplicate enqueues are suppressed by BullMQ.
- Rate-limit safe across workers: Redis `INCR` on a window key ensures atomic cross-instance counters.

Caveats / Remaining risks:
- If the SMTP service reports success but network partition prevents DB update, a retry could re-send. To further mitigate, you can implement a two-phase commit with an external idempotency token at the SMTP provider (if supported) or persist a sent-event with unique provider message-id and dedupe on that.

---

## Rate Limiting & Concurrency Behavior

- Concurrency: the worker concurrency is set via `WORKER_CONCURRENCY` and the BullMQ Worker `concurrency` option.
- Delay between emails: scheduling computes an offset per-recipient using `delayBetweenMs` input to ensure minimum gap.
- Emails-per-hour: implemented per-sender using Redis counters keyed by hour window. When the limit is reached:
  - The job is not dropped; it is rescheduled to the next available hour and the DB `scheduled_at` is updated.
  - This approach preserves order to the extent allowed by delayed re-queueing and job timing.
- Rate limit persistence: the code includes helper to sync counters to DB (`syncRateLimitToDb`) — either run as a background sync worker or periodically call it.

Behavior under load:
- The system enqueues many delayed jobs; BullMQ efficiently stores them in Redis.
- When 1000+ emails are scheduled at roughly the same time, the worker(s) will process jobs subject to concurrency and rate limits. Excess jobs will be delayed into next window.

Trade-offs:
- Rescheduling on rate-limit keeps jobs durable but can cause backlog if limits are tight.
- Perfect ordering across reschedules is hard; this implementation aims for best-effort order preservation.

---

## Frontend Overview & OAuth

- The frontend uses React + TypeScript and Tailwind. Key pages:
  - Login: supports Google OAuth (real flow) by redirecting to `/api/auth/google`.
  - Compose: enter subject/body, upload CSV, set start time, per-email delay and hourly limit, then POST to `/api/campaigns/schedule`.
  - Dashboard: shows scheduled and sent emails by querying campaigns and associated emails.

- Google OAuth:
  - Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in server `.env`.
  - Ensure redirect URI in Google Console matches `http://localhost:3000/api/auth/google/callback` (or your API host).

---

## Testing & Manual Smoke Test

Manual smoke test sequence you can run locally:

1. Start Redis, Postgres, API and worker (see Local Development).
2. Register a user or login with Google.
3. Create a campaign via the Compose UI with 5 recipients, `delayBetweenMs` = 2000 (2s), hourly limit = 10.
4. Confirm in the Dashboard that 5 emails are `SCHEDULED` and their `scheduled_at` timestamps look correct.
5. Observe the worker logs: as jobs run, emails should move to `SENT` and show a `message_id` from Ethereal.
6. Kill the worker, schedule another campaign with future start time; restart the worker — the scheduled jobs should still send at the planned time.
7. To test rate limiting: set `DEFAULT_EMAILS_PER_HOUR` to a small value (e.g., 1) and schedule 3 emails to start now — the worker should send one and reschedule others to the next hour window.

Automated tests: add integration tests using `supertest` for API and a local Redis/Postgres test harness or docker-compose-based tests.

---

## Operational Notes & Production Considerations

- Redis durability: use Redis persistence (AOF) in production or managed Redis with persistence.
- Postgres backups & migrations: use a robust migration tool (e.g., Flyway, Liquibase, or node-pg-migrate) and automated backups.
- Secrets management: never store plain SMTP credentials in DB; encrypt them or store them in a secrets service and reference securely.
- Monitoring: export queue/worker metrics (job counts, failures, queue latency) to Prometheus/Grafana.
- Observability: ensure worker logs include job IDs, email IDs, sender IDs and error stacks.
- Scaling:
  - Multiple worker instances are supported; rate-limiting uses Redis counters to coordinate.
  - Consider sharding senders across worker pools if extreme throughput is required.

---

## Assumptions, Trade-offs & Next Steps

Assumptions made in this implementation:
- Testing SMTP uses Ethereal accounts for safety and reproducibility.
- Per-sender SMTP credentials are stored in `senders.credentials` JSONB; worker will use them if present.
- The UI user model creates a default sender when registering.

Trade-offs:
- Simplicity over absolute ordering: rescheduling jobs preserves all jobs but can reorder slightly under contention.
- Rely on Redis/ BullMQ for delayed job persistence — this is standard practice but depends on Redis reliability.

Recommended next steps / optional improvements:
- Add an automated smoke/integration test verifying scheduling → restart → send behavior.
- Implement a DLQ or alerting pipeline for repeated job failures.
- Add a token-based idempotency layer with provider-side dedupe (if providers support it).
- Encrypt per-sender credentials at rest.

---

If you'd like, I can now:
- Add an integration smoke test that schedules a campaign, restarts the worker, and verifies emails are sent once.
- Produce a short demo script and screen-recording checklist you can use to capture the required 5-minute demo.

# OpenLabs
# Openlab
# Openlab
