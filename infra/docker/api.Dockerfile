# Stage 1: deps — install all dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace manifests for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install all dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────
# Stage 2: builder — compile TypeScript
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Generate Prisma client before building
RUN pnpm --filter @eduai/api prisma generate

# Build the NestJS app
RUN pnpm --filter @eduai/api build

# ─────────────────────────────────────────────
# Stage 3: runner — lean production image
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add tini for proper signal handling
RUN apk add --no-cache tini

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 nestjs

# Copy only what we need at runtime
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist        ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma       ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma  ./node_modules/.prisma

USER nestjs

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
