# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy workspace manifests only (for layer caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --filter @eduai/api --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN npx prisma generate && pnpm build

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install only production deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --filter @eduai/api --frozen-lockfile --prod

# Copy built output and Prisma artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Migrate then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
