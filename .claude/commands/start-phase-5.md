# /start-phase-5 — Deploy & Launch

Deploy to production. Prerequisites: All phases complete, all tests passing.

## Pre-launch Security Audit
### @qa-agent task:
"Run final security checklist:
- Confirm all routes return 401 without auth (test with curl, no token)
- Confirm cross-user data isolation (user A cannot fetch user B's shelves)
- Confirm Stripe webhook rejects unsigned requests
- Confirm CORS only allows production domain and localhost
- Confirm no secrets in client bundle (grep apps/web/dist/ for key patterns)
- Confirm rate limiting is active
- Run npm audit on all packages, report any high/critical vulnerabilities
Return pass/fail for each check."

## Deploy Steps (run after audit passes)

### Backend — Railway
"Deploy apps/api to Railway:
1. Create railway.toml with build + start commands
2. Set all production environment variables (list them, don't set values — user does this)
3. Configure health check endpoint GET /health → 200 OK
4. Set up PostgreSQL addon on Railway
5. Run prisma migrate deploy in Railway build step
Document the Railway deploy commands."

### Frontend — Vercel
"Deploy apps/web to Vercel:
1. Create vercel.json with build config
2. Set VITE_API_URL to Railway production URL
3. Configure redirects: /* → /index.html (SPA routing)
4. Set up custom domain instructions (placeholder: yourdomain.com)
Document the Vercel deploy commands."

## Post-Launch Monitoring Setup
"Set up basic monitoring:
1. Add GET /health endpoint to API returning { status: 'ok', version, timestamp }
2. Add Sentry SDK to both apps/api and apps/web (use SENTRY_DSN env var)
3. Add basic analytics: log signup events, shelf creation, book imports to a logs table
4. Write a weekly-digest cron job (node-cron) that emails reading stats to users who opt in
Document setup steps."

## Launch Checklist
- [ ] All environment variables set in Railway + Vercel dashboards
- [ ] Database migrated in production
- [ ] Stripe webhooks configured with production endpoint URL
- [ ] Custom domain pointing to Vercel
- [ ] SSL certificate active (auto via Vercel)
- [ ] Sentry receiving test events
- [ ] Smoke test: sign up → create shelf → add book → view 3D shelf → share
- [ ] Product Hunt draft saved and ready to submit

## Post-launch Feedback Loop
"Create a feedback collection system:
1. Add an in-app feedback widget (bottom-right, floating button) that opens a simple form: rating (1-5) + text
2. Store feedback in a Feedback table in the DB
3. Schedule a weekly report: @feedback-agent reads new feedback, summarises themes, creates a GitHub issue with 'roadmap' label for top requests
This creates the autonomous feedback → roadmap loop."

## Completion
"Phase 5 complete. Virtual Bookshelf is live. 🎉

Next actions:
1. Submit to Product Hunt (docs/marketing/product-hunt.md has your copy)
2. Post Twitter launch thread (docs/marketing/social-media.md)
3. Set up email waitlist in your email provider using docs/marketing/email-sequences.md
4. Monitor Railway + Vercel dashboards for first 24h
5. Watch Sentry for any production errors"
