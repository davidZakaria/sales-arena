# Live test checklist — Enterprise Operations Pipeline

Site: **https://sales-arena.duckdns.org** (or `http://` if no TLS yet)  
Password for all demo users: **`brm123456`**

Run on VPS after deploy:

```bash
cd /var/www/sales-arena
bash deploy/vps-healthcheck.sh
npm run db:list-users    # confirm ops user exists
```

---

## 1. Operations — Lead creation & audit (`ops@newjerseyegypt.com`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in → sidebar shows **Operations Hub** only | No Dashboard / Open Race links |
| 2 | `/operations` → **Lead Creation** tab | Create form + Draft table |
| 3 | Create lead with duplicate phone (e.g. `+201012345678`) | Amber duplicate alert + **Notify Broker** WhatsApp link |
| 4 | Create new unique lead | Appears in **Draft Leads** |
| 5 | **Publish to Open Race** on draft | Status → Open Race; visible on Open Race (as Manager) |
| 6 | **Audit Queue** tab | **Nile Brokers** listed (PENDING_AUDIT) |
| 7 | **Review Documents** → agency page | Audit Mode, uploaded docs, **Verify & Complete** |

---

## 2. Sales — Request assignment (`karim@newjerseyegypt.com`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `/open-race` | **Delta Properties** card |
| 2 | Button state | **Requested (Pending Manager)** (seed pending request) |
| 3 | Request another OPEN_RACE agency | Button becomes pending after submit |
| 4 | `/portfolio` | Assigned agencies only; no ARCHIVED |
| 5 | **Aqar Misr** → Compliance Vault | Tax ID/CR locked; upload zone active |
| 6 | Mock-upload TAX_ID, CR, CONTRACT | Auto → PENDING_AUDIT when all three present |

---

## 3. Manager — Inquiries, lead queue, disputes (`reem@newjerseyegypt.com`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `/manager` → **Live inquiries queue** | 2 NEW inquiries from seed; assign to rep |
| 2 | **Lead assignment queue** | 3 OPEN_RACE leads; assign via dropdown |
| 3 | **Team assignments** | Active team agencies with rep and status |
| 4 | **Disputed Assignments** | Oasis Estates dispute if seeded |
| 5 | `/inventory` | Jura + Green Avenue templates; create new template |

---

## 4. Director (`maya@newjerseyegypt.com`)

Same as Manager; **Direct Assign** shows all SALES reps (not just direct reports).

---

## 5. Archive flow (Ops or Manager)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open any non-archived agency | **Archive Agency** (red) in header |
| 2 | Confirm archive | Status badge **Archived** |
| 3 | Check `/open-race`, `/portfolio` | Agency no longer listed |
| 4 | Global search | Archived agency excluded |

---

## 6. Smoke commands (VPS)

```bash
# Health
bash deploy/vps-healthcheck.sh

# HTTP
curl -sS -o /dev/null -w "home %{http_code}\n" http://127.0.0.1:3005/en/login
curl -sS -o /dev/null -w "join %{http_code}\n" http://127.0.0.1:3005/en/join

# PM2
pm2 status sales-arena
pm2 logs sales-arena --lines 30 --nostream

# Migrations applied
npx prisma migrate status
```

---

## Fresh demo data (optional)

**Warning:** wipes all agencies/users and re-seeds.

```bash
npm run db:seed
pm2 reload sales-arena
```

---

## 7. Public broker intake (`/join`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/join` (no login) | Broker registration form |
| 2 | Submit unique agency + phone | Success message; draft in Ops Hub |
| 3 | Submit duplicate phone (`+201012345678`) | Friendly duplicate error (no internal details) |
| 4 | Fill hidden honeypot field (website) | Submission rejected |

---

## 8. WhatsApp webhook (`POST /api/webhooks/whatsapp`)

Requires `WHATSAPP_WEBHOOK_SECRET` in `.env`.

```bash
# Local or VPS (set secret from .env)
export WHATSAPP_WEBHOOK_SECRET="your-secret"
bash deploy/test-whatsapp-webhook.sh http://127.0.0.1:3005
```

| Step | Action | Expected |
|------|--------|----------|
| 1 | POST with valid Bearer token + new phone | `200` `{ ok: true, agencyId }` |
| 2 | Ops → Draft Leads | New row with **WhatsApp** source badge |
| 3 | POST same phone again | `409 Duplicate broker` |
| 4 | POST without / wrong token | `401 Unauthorized` |

---

## 9. EOI pipeline — Sales submit (`tantawy@newjerseyegypt.com`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | **Aqar Misr** → **EOIs** tab | Seed EOI **Pending Finance** visible |
| 2 | **Submit EOI** on **Aqar Misr** (ASSIGNED) | New row pending Finance |
| 3 | Co-pilot **Karim** on **Aqar Misr** | Can also submit EOI |
| 4 | Open Race agency | No Submit EOI (ASSIGNED/VERIFIED only) |

---

## 10. Finance Hub — EOI clearance (`finance@newjerseyegypt.com`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in → sidebar **Finance Hub** only | Badge = pending EOI count |
| 2 | `/finance` → EOI Clearance Queue | Seed EOI for Aqar Misr listed |
| 3 | **Review** → **Verify Funds** | Status → Verified |
| 4 | Submit new EOI (as Sales) → **Reject** with notes | Status → Rejected + notes |
| 5 | Submit new EOI → **Convert to Contract** | EOI Converted; agency contract **Signed** |
| 6 | Ops user on agency EOIs tab | Read-only view; **cannot** approve |

Password for Finance demo user: **`brm123456`** (`finance@newjerseyegypt.com`)
