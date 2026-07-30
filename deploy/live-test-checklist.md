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

## 3. Manager — Requests, SLA, disputes (`reem@newjerseyegypt.com`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `/manager` → **Pending Assignment Requests** | Karim → Delta Properties |
| 2 | **Approve & Assign** | Agency ASSIGNED; Karim primary owner; `claimExpiresAt` set (+14 days) |
| 3 | **SLA Breached Assignments** | Empty unless you backdate `claimExpiresAt` (see below) |
| 4 | **Disputed Assignments** | Existing disputes if seeded |
| 5 | `/open-race` | **Direct Assign** dropdown on each card |

**Simulate SLA breach (optional, on VPS):**

```bash
cd /var/www/sales-arena
npx tsx -e "
const { prisma } = require('./src/lib/prisma');
(async () => {
  const a = await prisma.agency.findFirst({ where: { status: 'ASSIGNED' } });
  if (!a) { console.log('No ASSIGNED agency'); return; }
  const past = new Date(); past.setDate(past.getDate() - 3);
  await prisma.agency.update({ where: { id: a.id }, data: { claimExpiresAt: past } });
  console.log('Backdated claimExpiresAt for', a.name);
  await prisma.\$disconnect();
})();
"
# Refresh /manager → SLA Breached Assignments should show the agency
```

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
curl -sS -o /dev/null -w "home %{http_code}\n" http://127.0.0.1:3005/
curl -sS -o /dev/null -w "login %{http_code}\n" http://127.0.0.1:3005/login

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
