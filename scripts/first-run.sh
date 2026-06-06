#!/usr/bin/env bash
# EduAI Ultimate — First Run Setup
# Bootstraps the full local development environment from scratch.
# Run once after cloning the repo:
#   bash scripts/first-run.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[info]${NC}  $*"; }
success() { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
error()   { echo -e "${RED}[error]${NC} $*" >&2; }
step()    { echo ""; echo -e "${BOLD}${CYAN}──── $* ${NC}"; }

# ---------------------------------------------------------------------------
# Resolve repo root (script can be run from any directory)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       EduAI Ultimate — First Run Setup           ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
step "Pre-flight checks"

# Node >= 18
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install Node 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  error "Node.js 18+ is required. Found: v${NODE_VERSION}"
  error "Install the latest LTS from https://nodejs.org or use nvm:"
  echo "    nvm install 18 && nvm use 18"
  exit 1
fi
success "Node.js v${NODE_VERSION}"

# pnpm
if ! command -v pnpm &>/dev/null; then
  error "pnpm is not installed."
  echo ""
  echo "  Install pnpm with:"
  echo "    npm install -g pnpm"
  echo "  or via Corepack (Node 16.9+):"
  echo "    corepack enable && corepack prepare pnpm@latest --activate"
  exit 1
fi
success "pnpm $(pnpm --version)"

# Docker
if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Install Docker Desktop from https://www.docker.com/products/docker-desktop"
  exit 1
fi
success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# Docker Compose (v2 plugin or standalone)
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
else
  error "Docker Compose is not available."
  echo "  Install Docker Desktop (includes Compose v2) or:"
  echo "    pip install docker-compose"
  exit 1
fi
success "Compose: $($COMPOSE_CMD version --short 2>/dev/null || echo 'detected')"

# ---------------------------------------------------------------------------
# Step 1: Copy .env files
# ---------------------------------------------------------------------------
step "Step 1: Environment files"

copy_env() {
  local example="$1"
  local target="$2"
  if [[ ! -f "$target" ]]; then
    cp "$example" "$target"
    success "Created ${target#"$REPO_ROOT"/}"
    warn "Review and update ${target#"$REPO_ROOT"/} before going to production."
  else
    info "${target#"$REPO_ROOT"/} already exists — skipping copy."
  fi
}

copy_env "${REPO_ROOT}/apps/api/.env.example" "${REPO_ROOT}/apps/api/.env"
copy_env "${REPO_ROOT}/apps/web/.env.example" "${REPO_ROOT}/apps/web/.env"

# ---------------------------------------------------------------------------
# Step 2: Start infrastructure services
# ---------------------------------------------------------------------------
step "Step 2: Starting infrastructure (Docker)"

info "Pulling images and starting: postgres, redis, elasticsearch, minio, mailhog"
cd "$REPO_ROOT"
$COMPOSE_CMD up -d postgres redis elasticsearch minio mailhog

info "Waiting for services to become healthy..."

wait_healthy() {
  local service="$1"
  local max_attempts="${2:-30}"
  local attempt=0
  while [[ $attempt -lt $max_attempts ]]; do
    STATUS=$($COMPOSE_CMD ps --format json "$service" 2>/dev/null \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health','') if isinstance(d,dict) else next((x.get('Health','') for x in d if x.get('Service')=='$service'), ''))" 2>/dev/null || echo "")
    if [[ "$STATUS" == "healthy" ]]; then
      success "${service} is healthy."
      return 0
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
  done
  echo ""
  warn "${service} did not report healthy within $((max_attempts * 2))s — continuing anyway."
}

for svc in postgres redis minio; do
  wait_healthy "$svc"
done

# Elasticsearch can be slow — give it extra time
wait_healthy "elasticsearch" 45

# MailHog has no health check — just confirm it is running
if $COMPOSE_CMD ps mailhog | grep -q "Up\|running"; then
  success "mailhog is running."
fi

# ---------------------------------------------------------------------------
# Step 3: Install dependencies
# ---------------------------------------------------------------------------
step "Step 3: Installing dependencies (pnpm install)"

cd "$REPO_ROOT"
pnpm install
success "Dependencies installed."

# ---------------------------------------------------------------------------
# Step 4: Run database migrations
# ---------------------------------------------------------------------------
step "Step 4: Database migrations (prisma migrate deploy)"

pnpm --filter @eduai/api exec prisma migrate deploy
success "Migrations applied."

# ---------------------------------------------------------------------------
# Step 5: Seed database
# ---------------------------------------------------------------------------
step "Step 5: Seeding database (prisma db seed)"

info "Seeding super-admin account and reference data..."
pnpm --filter @eduai/api exec prisma db seed
success "Database seeded."

# ---------------------------------------------------------------------------
# Step 6: Success summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║            Setup complete!                       ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Service URLs${NC}"
echo -e "  ┌──────────────────────────────────────────────────"
echo -e "  │  Web app      →  ${CYAN}http://localhost:3000${NC}"
echo -e "  │  API docs     →  ${CYAN}http://localhost:3001/api/docs${NC}"
echo -e "  │  MailHog UI   →  ${CYAN}http://localhost:8025${NC}"
echo -e "  │  MinIO UI     →  ${CYAN}http://localhost:9001${NC}"
echo -e "  └──────────────────────────────────────────────────"
echo ""
echo -e "  ${BOLD}Super-admin credentials${NC}"
echo -e "  ┌──────────────────────────────────────────────────"
echo -e "  │  Email     →  admin@eduai.io"
echo -e "  │  Password  →  EduAI@admin2024!"
echo -e "  └──────────────────────────────────────────────────"
echo ""
warn "Change the super-admin password immediately on first login."
echo ""

# ---------------------------------------------------------------------------
# Step 7: Optionally start the dev stack
# ---------------------------------------------------------------------------
echo -n "  Start the full dev stack now (api + web)? [y/N]: "
read -r START_DEV

if [[ "${START_DEV,,}" == "y" || "${START_DEV,,}" == "yes" ]]; then
  echo ""
  info "Starting dev servers via pnpm dev..."
  info "Press Ctrl+C at any time to stop."
  echo ""
  cd "$REPO_ROOT"
  pnpm dev
else
  echo ""
  info "You can start the dev stack later with:"
  echo "    pnpm dev"
  echo ""
fi
