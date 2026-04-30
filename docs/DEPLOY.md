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

## Frontend — Vercel

### Deploy commands
```bash
npm install -g vercel
vercel login
vercel --prod   # from repo root
```

### Required environment variables (set in Vercel dashboard)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Railway API URL, e.g. https://your-app.railway.app |
| VITE_CLERK_PUBLISHABLE_KEY | From Clerk dashboard -> API Keys |
| VITE_SENTRY_DSN | From Sentry dashboard (optional) |

### Custom domain
1. In Vercel dashboard -> your project -> Settings -> Domains
2. Add your domain (e.g. bookshelf.app)
3. Update DNS: add CNAME record pointing to `cname.vercel-dns.com`
4. SSL certificate is provisioned automatically by Vercel

### Post-deploy steps
1. Update `WEB_URL` in Railway to match your Vercel domain
2. Update Clerk -> Allowed origins to include your domain
3. Update Clerk -> Redirect URLs to include your domain
