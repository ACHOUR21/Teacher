.PHONY: help dev dev-infra prod down migrate seed test test-e2e logs db-reset lint typecheck build

## Default target: show help
help:
	@echo ""
	@echo "EduAI Ultimate — Available make targets"
	@echo "---------------------------------------"
	@echo "  dev          Start infrastructure (Postgres, Redis, ES, MinIO) + hot-reload API & Web"
	@echo "  dev-infra    Start only infrastructure containers (no app build)"
	@echo "  prod         Build and start full production stack with Docker Compose"
	@echo "  down         Stop and remove all containers"
	@echo "  migrate      Run pending Prisma migrations"
	@echo "  seed         Seed the database with demo data"
	@echo "  test         Run API unit tests"
	@echo "  test-e2e     Run Playwright end-to-end tests"
	@echo "  lint         Lint all packages"
	@echo "  typecheck    TypeScript type-check all packages"
	@echo "  build        Build all packages (shared, ai, api, web)"
	@echo "  logs         Tail logs from all running containers"
	@echo "  db-reset     Wipe volumes, re-migrate and seed (DESTRUCTIVE)"
	@echo ""

## Start infrastructure services then run apps locally with hot-reload
dev: dev-infra
	pnpm run dev

## Start only Postgres, Redis, Elasticsearch, MinIO and supporting services
dev-infra:
	docker compose up postgres redis elasticsearch minio mailhog -d
	@echo "Waiting for Postgres to be ready..."
	@until docker compose exec postgres pg_isready -U eduai -d eduai_db > /dev/null 2>&1; do sleep 1; done
	@echo "Infrastructure is ready."

## Build and start the full production stack (API + Web + all infra)
prod:
	docker compose -f docker-compose.prod.yml up --build -d

## Stop all containers and remove them (volumes are preserved)
down:
	docker compose down
	docker compose -f docker-compose.prod.yml down 2>/dev/null || true

## Apply pending Prisma database migrations
migrate:
	cd apps/api && pnpm prisma migrate deploy

## Seed the database with demo / fixture data
seed:
	cd apps/api && pnpm prisma db seed

## Run API unit tests
test:
	pnpm --filter @eduai/api test -- --passWithNoTests --forceExit

## Run Playwright end-to-end tests (requires running stack)
test-e2e:
	cd apps/web && npx playwright test

## Lint all workspaces
lint:
	pnpm run lint

## TypeScript type-check all workspaces
typecheck:
	pnpm --filter @eduai/shared build
	pnpm --filter @eduai/ai build
	pnpm --filter @eduai/api exec tsc --noEmit
	pnpm --filter @eduai/web exec tsc --noEmit

## Build all packages
build:
	pnpm --filter @eduai/shared build
	pnpm --filter @eduai/ai build
	pnpm --filter @eduai/api build
	pnpm --filter @eduai/web build

## Tail container logs (Ctrl+C to exit)
logs:
	docker compose logs -f

## DESTRUCTIVE: Remove data volumes, re-run migrations, re-seed
db-reset:
	docker compose down -v
	docker compose up postgres -d
	@echo "Waiting for Postgres..."
	@until docker compose exec postgres pg_isready -U eduai -d eduai_db > /dev/null 2>&1; do sleep 1; done
	cd apps/api && pnpm prisma migrate deploy
	cd apps/api && pnpm prisma db seed
	@echo "Database reset complete."
