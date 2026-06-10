#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing pnpm"
npm install -g pnpm@9

echo "==> Installing dependencies"
pnpm install

echo "==> Creating .env files from examples"
if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env 2>/dev/null || cat > apps/api/.env << 'ENVEOF'
NODE_ENV=development
PORT=4000

# Database — Codespaces PostgreSQL (no password by default)
DATABASE_URL="postgresql://postgres@localhost:5432/eduai_dev?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="codespaces-dev-secret-change-in-prod"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="codespaces-refresh-secret-change-in-prod"
JWT_REFRESH_EXPIRES_IN="30d"

# App
APP_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000"

# Storage (local minio or leave blank)
STORAGE_PROVIDER="local"
LOCAL_STORAGE_PATH="./uploads"

# AI (optional — endpoints will return 401/503 without keys)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Stripe (optional)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
ENVEOF
fi

if [ ! -f apps/web/.env.local ]; then
  cat > apps/web/.env.local << 'WEBENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBENVEOF
fi

echo "==> Setting up PostgreSQL"
# Create DB user and database (Codespaces postgres has no password)
createdb eduai_dev 2>/dev/null || echo "DB already exists"

echo "==> Running Prisma migrations"
cd apps/api
pnpm exec prisma migrate deploy 2>/dev/null || pnpm exec prisma migrate dev --name init --skip-seed
echo "==> Seeding database"
pnpm exec prisma db seed || echo "Seed skipped (may already have data)"
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start the API:  pnpm --filter api dev    (port 4000)"
echo "Start the web:  pnpm --filter web dev    (port 3000)"
echo "Swagger docs:   http://localhost:4000/api/docs"
echo ""
echo "Seed credentials:"
echo "  Super Admin : admin@eduai.app    / Admin@123456"
echo "  Teacher     : teacher@eduai.app  / Teacher@123"
echo "  Student     : student@eduai.app  / Student@123"
