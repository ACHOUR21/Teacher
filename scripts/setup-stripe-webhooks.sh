#!/usr/bin/env bash
# EduAI Ultimate — Stripe Webhook Setup
# Sets up Stripe webhooks for the billing module.
# Usage:
#   ./scripts/setup-stripe-webhooks.sh               # create webhook endpoint
#   ./scripts/setup-stripe-webhooks.sh --listen       # forward events to local server (dev)

set -euo pipefail

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

info()    { echo -e "${CYAN}[info]${NC}  $*"; }
success() { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
error()   { echo -e "${RED}[error]${NC} $*" >&2; }

# ---------------------------------------------------------------------------
# 1. Check STRIPE_SECRET_KEY
# ---------------------------------------------------------------------------
if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  error "STRIPE_SECRET_KEY is not set."
  echo ""
  echo "  Export it before running this script:"
  echo "    export STRIPE_SECRET_KEY=sk_test_..."
  echo ""
  echo "  Or load your .env file first:"
  echo "    set -a && source apps/api/.env && set +a"
  exit 1
fi
success "STRIPE_SECRET_KEY found."

# ---------------------------------------------------------------------------
# 2. Check Stripe CLI
# ---------------------------------------------------------------------------
if ! command -v stripe &>/dev/null; then
  error "Stripe CLI is not installed or not on PATH."
  echo ""
  echo "  Install instructions:"
  echo "    macOS:   brew install stripe/stripe-cli/stripe"
  echo "    Linux:   https://stripe.com/docs/stripe-cli#install"
  echo "    Windows: https://stripe.com/docs/stripe-cli#install"
  echo ""
  echo "  After installing, authenticate with:"
  echo "    stripe login"
  exit 1
fi

STRIPE_VERSION=$(stripe version 2>&1)
success "Stripe CLI detected: ${STRIPE_VERSION}"

# ---------------------------------------------------------------------------
# 3. Determine webhook URL
# ---------------------------------------------------------------------------
LISTEN_MODE=false
if [[ "${1:-}" == "--listen" ]]; then
  LISTEN_MODE=true
fi

if [[ -z "${WEBHOOK_URL:-}" ]]; then
  if [[ "$LISTEN_MODE" == "true" ]]; then
    # In listen mode the Stripe CLI handles routing — use the local API directly
    WEBHOOK_URL="http://localhost:3001"
  else
    echo ""
    echo -n "  Enter your webhook base URL (e.g. https://api.yourdomain.com): "
    read -r WEBHOOK_URL
    WEBHOOK_URL="${WEBHOOK_URL%/}" # strip trailing slash
  fi
fi

if [[ -z "$WEBHOOK_URL" ]]; then
  error "No webhook URL provided. Exiting."
  exit 1
fi

# ---------------------------------------------------------------------------
# Events to subscribe to
# ---------------------------------------------------------------------------
EVENTS=(
  "customer.subscription.created"
  "customer.subscription.updated"
  "customer.subscription.deleted"
  "invoice.payment_succeeded"
  "invoice.payment_failed"
  "checkout.session.completed"
  "customer.created"
  "payment_intent.succeeded"
  "payment_intent.payment_failed"
)

# ---------------------------------------------------------------------------
# 4a. Listen mode (dev) — forward events to local server
# ---------------------------------------------------------------------------
if [[ "$LISTEN_MODE" == "true" ]]; then
  FORWARD_URL="${WEBHOOK_URL}/billing/webhook"
  info "Starting Stripe listener → forwarding to: ${FORWARD_URL}"
  echo ""
  warn "Keep this terminal open while developing. Press Ctrl+C to stop."
  echo ""
  stripe listen --forward-to "$FORWARD_URL"
  exit 0
fi

# ---------------------------------------------------------------------------
# 4b. Create a permanent webhook endpoint
# ---------------------------------------------------------------------------
ENDPOINT_URL="${WEBHOOK_URL}/api/v1/billing/webhook"
info "Creating Stripe webhook endpoint for: ${ENDPOINT_URL}"
echo ""

# Build --events flags
EVENTS_FLAGS=()
for event in "${EVENTS[@]}"; do
  EVENTS_FLAGS+=("--events" "$event")
done

RESPONSE=$(stripe webhooks create \
  --url "$ENDPOINT_URL" \
  "${EVENTS_FLAGS[@]}" \
  --api-key "$STRIPE_SECRET_KEY" \
  2>&1)

if echo "$RESPONSE" | grep -q "signing_secret\|whsec_"; then
  SIGNING_SECRET=$(echo "$RESPONSE" | grep -oP 'whsec_[A-Za-z0-9]+' | head -1)
  echo ""
  success "Webhook endpoint created successfully!"
  echo ""
  echo "  Subscribed events:"
  for event in "${EVENTS[@]}"; do
    echo "    • ${event}"
  done
  echo ""
  echo "  ─────────────────────────────────────────────────────────"
  echo -e "  Webhook Signing Secret: ${GREEN}${SIGNING_SECRET}${NC}"
  echo "  ─────────────────────────────────────────────────────────"
  echo ""
  echo "  Add this to your apps/api/.env:"
  echo "    STRIPE_WEBHOOK_SECRET=${SIGNING_SECRET}"
  echo ""
  warn "Store this secret securely — Stripe will not show it again."
else
  error "Failed to create webhook. Stripe CLI output:"
  echo "$RESPONSE"
  exit 1
fi
