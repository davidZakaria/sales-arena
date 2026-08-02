#!/usr/bin/env bash
# Test WhatsApp webhook locally or on VPS.
# Usage: WHATSAPP_WEBHOOK_SECRET=your-secret ./deploy/test-whatsapp-webhook.sh [base-url]

set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3005}"
SECRET="${WHATSAPP_WEBHOOK_SECRET:-}"

if [ -z "$SECRET" ]; then
  echo "Set WHATSAPP_WEBHOOK_SECRET in the environment or .env"
  exit 1
fi

curl -sS -X POST "${BASE_URL}/api/webhooks/whatsapp" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerName": "Webhook Test Broker",
    "phone": "+201099988877",
    "message": "Interested via WhatsApp bot"
  }' | jq .

echo ""
echo "Check /operations Draft Leads for source=WhatsApp, or re-run with duplicate phone for 409."

echo ""
echo "--- INQUIRY payload (Live Inquiries Queue on /manager) ---"
curl -sS -X POST "${BASE_URL}/api/webhooks/whatsapp" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INQUIRY",
    "brokerPhone": "+201088877766",
    "message": "Any 2-bed in Jura under 5M? Client ready to visit."
  }' | jq .

echo ""
echo "Check /manager Live Inquiries Queue for the new row."
