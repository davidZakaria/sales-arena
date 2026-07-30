#!/usr/bin/env bash
# Full deploy for sales-arena on VPS.
# Usage: cd /var/www/sales-arena && bash deploy/vps-deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"

echo "=== sales-arena deploy ==="
echo "Directory: $APP_DIR"
echo

if [[ ! -f .env ]]; then
  echo "ERROR: .env missing. Copy from .env.example and fill in values:"
  echo "  cp .env.example .env && nano .env"
  exit 1
fi

echo "[1/6] git pull"
git pull origin main

echo "[2/6] npm ci"
npm ci

echo "[3/6] prisma migrate deploy"
npm run db:deploy

echo "[4/6] prisma generate (postinstall should run; explicit for safety)"
npx prisma generate

echo "[5/6] next build"
npm run build

echo "[6/6] pm2 reload"
if pm2 describe sales-arena >/dev/null 2>&1; then
  pm2 reload sales-arena
else
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo
echo "Deploy complete. Run: bash deploy/vps-healthcheck.sh"
echo "Optional fresh demo data: npm run db:seed"
