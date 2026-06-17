# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────
# Stage 2: builder
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN pnpm --filter @eduai/api prisma generate
RUN pnpm --filter @eduai/api build

# ─────────────────────────────────────────────
# Stage 3: runner — BullMQ worker process
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache tini

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 worker

# Same artifact set as the API but entrypoint points at the worker bootstrap
COPY --from=builder --chown=worker:nodejs /app/apps/api/dist        ./dist
COPY --from=builder --chown=worker:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/api/prisma       ./prisma
COPY --from=builder --chown=worker:nodejs /app/node_modules/.prisma  ./node_modules/.prisma

USER worker

# Workers don't serve HTTP traffic — no EXPOSE needed.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/worker"]
