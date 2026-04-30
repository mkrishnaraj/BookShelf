# Running Virtual Bookshelf Locally with Docker

## What this runs

| Container | What | Port |
|-----------|------|------|
| `vb-web` | React PWA (nginx) | http://localhost |
| `vb-api` | Express API | http://localhost:3001 |
| `vb-postgres` | PostgreSQL 16 | localhost:5432 |
| `vb-redis` | Redis 7 | localhost:6379 |
| `vb-migrate` | Runs DB migrations once, then exits | — |
| `vb-stripe-cli` | Stripe webhook forwarding (dev only) | — |

nginx proxies all `/api/*` requests from the frontend to the API container,
so the browser only ever talks to port 80 — no CORS issues.

---

## Prerequisites

Install these before you begin:

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | Latest | [docker.com/products/docker-desktop](https://docker.com/products/docker-desktop) |
| make | Any | Pre-installed on Mac/Linux. Windows: use WSL2 or run commands manually |

That's it. You don't need Node, pnpm, or PostgreSQL installed locally — Docker provides everything.

---

## Step 1 — Copy the environment file

```bash
make setup
# or manually:
cp .env.docker.example .env.docker
```

Open `.env.docker` and fill in your API keys. The minimum required to boot:

| Variable | Required to boot? | Where to get it |
|----------|------------------|-----------------|
| `POSTGRES_PASSWORD` | ✅ Yes (has default) | Make up a strong password |
| `REDIS_PASSWORD` | ✅ Yes (has default) | Make up a password |
| `CLERK_SECRET_KEY` | ✅ Yes | clerk.com → API Keys |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Yes | clerk.com → API Keys |
| `STRIPE_SECRET_KEY` | ✅ Yes | dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | See Step 4 below |
| `ANTHROPIC_API_KEY` | ✅ Yes (for scan/AI features) | console.anthropic.com |
| `GOOGLE_BOOKS_API_KEY` | ⚠️ Optional | console.cloud.google.com |
| `CLOUDINARY_*` | ⚠️ Optional | cloudinary.com (needed for shelf sharing) |
| `STRIPE_*_PRICE_ID` | ⚠️ Optional | Needed for subscription upgrades |

**The app will start without Cloudinary and Google Books** — those features will just be disabled until you add the keys.

---

## Step 2 — Build and start everything

```bash
make up
```

First run takes 3–5 minutes (building Docker images). Subsequent starts take ~10 seconds.

Watch the startup sequence:
```bash
make logs
```

You'll see:
```
vb-postgres  | database system is ready to accept connections
vb-redis     | Ready to accept connections
vb-migrate   | Running migrations... ✓
vb-migrate   | Seeding database... ✓
vb-migrate   | Migrations complete.
vb-api       | 🚀 API running on port 3001
vb-web       | nginx started
```

Open http://localhost — the app is running.

---

## Step 3 — Set up Stripe webhooks (for payments to work)

Stripe needs to send events to your local API. The `stripe-cli` container handles this automatically in dev mode:

```bash
# Start with Stripe webhook forwarding
make up-dev
```

OR if you prefer to run Stripe CLI on your host machine:

```bash
# Install Stripe CLI on your machine (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local API
stripe listen --forward-to http://localhost:3001/api/v1/webhooks/stripe \
              --forward-connect-to http://localhost:3001/api/v1/webhooks/stripe
```

Copy the webhook signing secret that `stripe listen` prints and add it to `.env.docker`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
```

Then restart the API:
```bash
docker compose --env-file .env.docker restart api
```

---

## Step 4 — Verify everything is working

```bash
# Check all containers are healthy
make status

# Check API health endpoint
make health
# Expected: {"status":"ok","version":"1.0.0","timestamp":"..."}

# Open the app
open http://localhost
```

---

## Daily development workflow

### Option A — Full Docker (everything in containers)
Best for: testing the production build, QA, demos.

```bash
make up        # start everything
make logs      # watch logs
make down      # stop (data preserved)
```

### Option B — Hybrid (DB in Docker, code on host)
Best for: active development with hot reload.

Run only the infrastructure in Docker:
```bash
docker compose --env-file .env.docker up -d postgres redis
```

Then run the app on your host machine (with hot reload):
```bash
# Terminal 1
pnpm --filter api dev      # API with ts-node watch on localhost:3001

# Terminal 2
pnpm --filter web dev      # Vite dev server on localhost:5173
```

In this mode, update your local `.env` (not `.env.docker`) with:
```
DATABASE_URL=postgresql://vb_user:vb_password@localhost:5432/virtual_bookshelf
REDIS_URL=redis://:vb_redis_password@localhost:6379
```

---

## Common operations

### View logs
```bash
make logs          # all services
make logs-api      # API only
make logs-web      # nginx only
```

### Open a database shell
```bash
make psql
# You're now in psql connected to virtual_bookshelf
# \dt    — list all tables
# \q     — quit
```

### Run Redis CLI
```bash
make redis-cli
# You're now in redis-cli
# KEYS *        — list all keys
# FLUSHALL      — clear all data (careful!)
```

### After changing the Prisma schema
```bash
# On your host machine (runs migration + regenerates client)
pnpm --filter db migrate dev --name your_migration_name

# Or inside Docker
make migrate
```

### Backup the database
```bash
make db-dump
# Creates: backup_YYYYMMDD_HHMMSS.sql in project root
```

### Restore a backup
```bash
make db-restore FILE=backup_20240101_120000.sql
```

### Trigger test Stripe events
```bash
make stripe-test-checkout      # simulate a successful purchase
make stripe-test-cancel        # simulate a subscription cancellation
make stripe-test-payment-fail  # simulate a failed payment
```

---

## Rebuilding after code changes

The production Docker build bakes your code into the image.
After changing code, rebuild:

```bash
# Rebuild only the changed service (faster)
docker compose --env-file .env.docker build api && docker compose --env-file .env.docker up -d api

# Rebuild everything
make rebuild
```

> **Tip:** For active development, use Option B (hybrid mode) above — no rebuilds needed, changes are instant.

---

## Resetting everything (fresh start)

This wipes all containers, volumes, and local images:

```bash
make reset
```

Then start fresh:
```bash
make up
```

---

## Environment variable reference

All variables are documented in `.env.docker.example`.
Never commit `.env.docker` to git — it contains secrets.

The `.gitignore` already excludes it:
```
.env.docker
.env.local
.env.production
```

---

## Troubleshooting

### Port already in use
```
Error: bind: address already in use (port 80 or 5432)
```
Something else is using that port. Find and stop it:
```bash
# Find what's using port 80
lsof -i :80

# Or change the port in docker-compose.yml:
ports:
  - "8080:80"   # access at http://localhost:8080 instead
```

### Migrations fail on first run
Usually means the database password in `.env.docker` doesn't match what Postgres initialised with. Fix:
```bash
make reset    # wipes the volume, starts fresh
make up
```

### API container keeps restarting
```bash
make logs-api    # read the error message
```
Most common cause: missing required environment variable. Check `.env.docker` has all required values.

### "Cannot connect to Docker daemon"
Docker Desktop isn't running. Open Docker Desktop and wait for it to start, then retry.

### Stripe webhooks not being received
Make sure `stripe listen` is running (either via `make up-dev` or on your host), and the `STRIPE_WEBHOOK_SECRET` in `.env.docker` matches the secret printed by `stripe listen`.
