#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/sales-arena}"
PORT="${PORT:-3005}"
DOMAIN="${DOMAIN:-sales-arena.duckdns.org}"

echo "=== sales-arena health check ==="
echo "App dir: $APP_DIR"
echo

cd "$APP_DIR"

echo "[1] Required files"
for f in .env package.json ecosystem.config.cjs prisma/prod.db; do
  if [[ -f "$f" ]]; then
    echo "  OK  $f"
  else
    echo "  MISSING  $f"
  fi
done
echo

echo "[2] .env keys"
for key in DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL PORT NODE_ENV; do
  if grep -q "^${key}=" .env 2>/dev/null; then
    echo "  OK  $key"
  else
    echo "  MISSING  $key"
  fi
done
echo

echo "[3] PM2 status"
pm2 describe sales-arena 2>/dev/null || echo "  PM2 app 'sales-arena' not found"
echo

echo "[4] Port $PORT listener"
if ss -tlnp | grep -q ":${PORT} "; then
  ss -tlnp | grep ":${PORT} " || true
else
  echo "  NOTHING listening on port $PORT"
fi
echo

echo "[5] Local HTTP check"
curl -sS -o /dev/null -w "  curl 127.0.0.1:${PORT} -> HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/" || echo "  curl failed"
echo

echo "[6] Nginx site"
if [[ -f /etc/nginx/sites-enabled/sales-arena ]]; then
  echo "  OK  nginx site enabled"
else
  echo "  MISSING  /etc/nginx/sites-enabled/sales-arena"
  echo "         Run: sudo cp deploy/nginx-sales-arena.conf /etc/nginx/sites-available/sales-arena"
  echo "              sudo ln -sf /etc/nginx/sites-available/sales-arena /etc/nginx/sites-enabled/"
  echo "              sudo nginx -t && sudo systemctl reload nginx"
fi
echo

echo "[7] Public domain check"
curl -sS -o /dev/null -w "  curl http://${DOMAIN} -> HTTP %{http_code}\n" "http://${DOMAIN}/" || echo "  public curl failed (DNS/nginx/firewall?)"
echo

echo "[8] Recent PM2 logs"
pm2 logs sales-arena --lines 15 --nostream 2>/dev/null || true
