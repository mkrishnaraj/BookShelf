# Deployment Guide

## Backend — Railway

### Prerequisites
- Railway CLI: `npm install -g @railway/cli`
- PostgreSQL addon created in Railway project

### Deploy commands
```bash
railway login
railway link          # link to your Railway project
railway up            # deploy
railway run pnpm db:migrate:deploy   # run migrations
```

### Required environment variables (set in Railway dashboard)
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string (auto-set by Railway Postgres addon) |
| CLERK_SECRET_KEY | From Clerk dashboard → API Keys |
| STRIPE_SECRET_KEY | From Stripe dashboard → Developers → API keys |
| STRIPE_WEBHOOK_SECRET | From Stripe dashboard → Webhooks → signing secret |
| STRIPE_READER_MONTHLY_PRICE_ID | Stripe Price ID for Reader monthly plan |
| STRIPE_READER_ANNUAL_PRICE_ID | Stripe Price ID for Reader annual plan |
| STRIPE_COLLECTOR_MONTHLY_PRICE_ID | Stripe Price ID for Collector monthly |
| STRIPE_COLLECTOR_ANNUAL_PRICE_ID | Stripe Price ID for Collector annual |
| STRIPE_BIBLIOPHILE_MONTHLY_PRICE_ID | Stripe Price ID for Bibliophile monthly |
| STRIPE_BIBLIOPHILE_ANNUAL_PRICE_ID | Stripe Price ID for Bibliophile annual |
| GOOGLE_BOOKS_API_KEY | From Google Cloud Console → APIs & Services |
| ANTHROPIC_API_KEY | From console.anthropic.com |
| CLOUDINARY_CLOUD_NAME | From Cloudinary dashboard |
| CLOUDINARY_API_KEY | From Cloudinary dashboard |
| CLOUDINARY_API_SECRET | From Cloudinary dashboard |
| WEB_URL | Your Vercel frontend URL (e.g. https://bookshelf.app) |
| NODE_ENV | production |

### Post-deploy steps
1. Set Stripe webhook endpoint: `https://your-railway-url.railway.app/api/webhooks/stripe`
2. Enable these Stripe events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `account.updated`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var

## Railway Setup Checklist

### Step 1 — Create a New Project
- [ ] Go to railway.app → **New Project** → **Deploy from GitHub repo**
- [ ] Connect GitHub and select the `BookShelf` repository

### Step 2 — Add PostgreSQL
- [ ] Inside the project → **+ New** → **Database** → **Add PostgreSQL**
- [ ] `DATABASE_URL` is set automatically — do not add it manually

### Step 3 — Set Environment Variables
Go to your service → **Variables** tab and add all of the following:

**Auth**
| Variable | Where to get it |
|----------|----------------|
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |

**Stripe**
| Variable | Where to get it |
|----------|----------------|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Set after Step 5 |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Set after Step 5 |
| `STRIPE_READER_MONTHLY_PRICE_ID` | Stripe → Products → Reader → monthly price ID |
| `STRIPE_READER_ANNUAL_PRICE_ID` | Stripe → Products → Reader → annual price ID |
| `STRIPE_COLLECTOR_MONTHLY_PRICE_ID` | Stripe → Products → Collector → monthly price ID |
| `STRIPE_COLLECTOR_ANNUAL_PRICE_ID` | Stripe → Products → Collector → annual price ID |
| `STRIPE_BIBLIOPHILE_MONTHLY_PRICE_ID` | Stripe → Products → Bibliophile → monthly price ID |
| `STRIPE_BIBLIOPHILE_ANNUAL_PRICE_ID` | Stripe → Products → Bibliophile → annual price ID |

**External APIs**
| Variable | Where to get it |
|----------|----------------|
| `GOOGLE_BOOKS_API_KEY` | Google Cloud Console → APIs & Services |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

**Cloudinary**
| Variable | Where to get it |
|----------|----------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard |

**App config**
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `WEB_URL` | Your Vercel frontend URL (fill in after Vercel deploy) |

### Step 4 — Verify Build Config
- [ ] Railway auto-detects `railway.toml` — confirm it shows:
  - Build: `pnpm install --frozen-lockfile && pnpm --filter db generate && pnpm --filter api build`
  - Start: `node apps/api/dist/index.js`
  - Health check: `/health`

### Step 5 — Set Up Stripe Webhooks (after first deploy)
Once Railway assigns a public URL (e.g. `https://your-app.up.railway.app`):

- [ ] Stripe → Developers → Webhooks → **Add endpoint**
  - URL: `https://your-app.up.railway.app/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `account.updated`
  - Copy signing secret → paste into `STRIPE_WEBHOOK_SECRET`
- [ ] Stripe → Connect → Webhooks → **Add endpoint**
  - URL: `https://your-app.up.railway.app/api/webhooks/stripe-connect`
  - Events: `account.updated`
  - Copy signing secret → paste into `STRIPE_CONNECT_WEBHOOK_SECRET`

### Step 6 — Run Database Migrations
```bash
railway run pnpm db:migrate:deploy
```

### Step 7 — Verify
- [ ] Visit `https://your-app.up.railway.app/health` → should return `200 OK`
- [ ] After frontend deploys: update `WEB_URL` in the API service variables to your frontend Railway domain

> **Order matters:** Add DB → set vars → deploy API → get API URL → deploy frontend → update `WEB_URL` → configure Stripe webhooks → run migrations

---

## Frontend — Railway

The frontend runs as a second Railway service in the same project, built with Docker + nginx.

### Step 1 — Add a second service
- In your Railway project → **+ New** → **GitHub Repo** → same repo
- Under **Settings** → **Build** → set **Dockerfile path** to `apps/web/Dockerfile`

### Step 2 — Set build variables
These are **build-time** args (set under **Variables** in the frontend service):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway API service URL, e.g. `https://api.yourdomain.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard → API Keys |

> These are baked into the static build at compile time — not runtime env vars.

### Step 3 — Custom domain
- Frontend service → **Settings** → **Networking** → **Add Custom Domain**
- Add your root domain, e.g. `yourdomain.com`
- In Spaceship DNS: add a `CNAME` record for `@` pointing to the Railway-provided CNAME target
- SSL is provisioned automatically by Railway

### Step 4 — Post-deploy
- [ ] Update `WEB_URL` in the API service to `https://yourdomain.com`
- [ ] In Clerk dashboard → **Allowed Origins**: add `https://yourdomain.com`
- [ ] In Clerk dashboard → **Redirect URLs**: add `https://yourdomain.com`

---

## Migrating Frontend to Vercel (future, no code changes needed)

`vercel.json` is already in the repo. When you're ready to switch:

1. Go to vercel.com → **Add New Project** → import the GitHub repo
2. Set these env vars in the Vercel dashboard:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your Railway API URL, e.g. `https://api.yourdomain.com` |
   | `VITE_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard → API Keys |
3. In Spaceship DNS: change the `@` CNAME to point to `cname.vercel-dns.com` (remove the old Railway CNAME)
4. Add your domain in Vercel → project → **Settings** → **Domains**
5. Update `WEB_URL` in your Railway API service to `https://yourdomain.com`
6. Update Clerk → **Allowed Origins** and **Redirect URLs** to `https://yourdomain.com`

SSL and CDN are provisioned automatically by Vercel. No code changes required.
