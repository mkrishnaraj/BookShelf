# Virtual Bookshelf — Docker shortcuts
# Usage: make <target>
# Requires: Docker Desktop (or Docker Engine + Compose plugin)

ENV_FILE ?= .env.docker
COMPOSE  = docker compose --env-file $(ENV_FILE)

# ── Setup ─────────────────────────────────────────────────────

## First-time setup: copy env template
setup:
	@if [ ! -f .env.docker ]; then \
		cp .env.docker.example .env.docker; \
		echo "✅ Created .env.docker — fill in your API keys before running 'make up'"; \
	else \
		echo "ℹ️  .env.docker already exists"; \
	fi

# ── Main commands ─────────────────────────────────────────────

## Start all services (production mode, fully containerised)
up:
	$(COMPOSE) up -d --build
	@echo ""
	@echo "🚀 Virtual Bookshelf is starting..."
	@echo "   Web:      http://localhost"
	@echo "   API:      http://localhost:3001"
	@echo "   Postgres: localhost:5432"
	@echo "   Redis:    localhost:6379"
	@echo ""
	@echo "Run 'make logs' to watch startup logs"

## Start with Stripe CLI webhook forwarding (dev mode)
up-dev:
	$(COMPOSE) --profile dev up -d --build
	@echo "🔌 Stripe CLI is forwarding webhooks to http://localhost:3001"

## Stop all services (keeps volumes/data)
down:
	$(COMPOSE) down

## Stop and wipe ALL data (volumes, images) — fresh start
reset:
	$(COMPOSE) down -v --rmi local
	@echo "🗑️  All containers, volumes, and local images removed"

## Rebuild images without cache (after major dependency changes)
rebuild:
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

# ── Logs ──────────────────────────────────────────────────────

## Tail logs from all services
logs:
	$(COMPOSE) logs -f

## Tail API logs only
logs-api:
	$(COMPOSE) logs -f api

## Tail web logs only
logs-web:
	$(COMPOSE) logs -f web

# ── Database ──────────────────────────────────────────────────

## Run Prisma migrations manually (useful after schema changes)
migrate:
	$(COMPOSE) run --rm migrate

## Open an interactive psql shell
psql:
	$(COMPOSE) exec postgres psql -U vb_user -d virtual_bookshelf

## Dump the database to a local file
db-dump:
	$(COMPOSE) exec postgres pg_dump -U vb_user virtual_bookshelf > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database dumped"

## Restore from a dump file: make db-restore FILE=backup_20240101_120000.sql
db-restore:
	$(COMPOSE) exec -T postgres psql -U vb_user -d virtual_bookshelf < $(FILE)

# ── Debugging ─────────────────────────────────────────────────

## Check running container status
status:
	$(COMPOSE) ps

## Open a shell inside the API container
shell-api:
	$(COMPOSE) exec api sh

## Open a shell inside the web container
shell-web:
	$(COMPOSE) exec web sh

## Open Redis CLI
redis-cli:
	$(COMPOSE) exec redis redis-cli -a $$(grep REDIS_PASSWORD $(ENV_FILE) | cut -d= -f2)

## Run API health check
health:
	@curl -s http://localhost:3001/health | python3 -m json.tool || echo "API not ready yet"

# ── Stripe ────────────────────────────────────────────────────

## Trigger a test Stripe webhook event (requires stripe CLI on host)
stripe-test-checkout:
	stripe trigger checkout.session.completed

stripe-test-cancel:
	stripe trigger customer.subscription.deleted

stripe-test-payment-fail:
	stripe trigger invoice.payment_failed

.PHONY: setup up up-dev down reset rebuild logs logs-api logs-web \
        migrate psql db-dump db-restore status shell-api shell-web \
        redis-cli health stripe-test-checkout stripe-test-cancel stripe-test-payment-fail
