# BRM — Broker Relationship Management

MVP for managing broker agency relationships, compliance data, and Open Race assignments under an **Operations-led pipeline**.

## Stack

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS + shadcn/ui
- Prisma ORM + SQLite (local MVP)
- NextAuth.js (local email/password accounts)

## Agency lifecycle

```
DRAFT → OPEN_RACE → ASSIGNED → PENDING_AUDIT → VERIFIED
```

| Status | Who acts |
|--------|----------|
| `DRAFT` | Operations creates and validates leads |
| `OPEN_RACE` | Sales request assignment; Managers assign |
| `ASSIGNED` | Sales uploads compliance documents |
| `PENDING_AUDIT` | Operations verifies typed data from documents |
| `VERIFIED` | Terminal — Tax ID, CR, and contract confirmed |

## Getting started

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

Password for all seeded users: `brm123456`

| Role | Email | Notes |
| ---- | ----- | ----- |
| Operations | ops@newjerseyegypt.com | Operations Hub — create leads, audit queue |
| Sales (Primary) | tantawy@newjerseyegypt.com | Owns most assigned agencies |
| Sales (Co-Pilot / Requests) | karim@newjerseyegypt.com | Co-pilot on Aqar Misr; pending request on Delta Properties |
| Manager | reem@newjerseyegypt.com | Manager Dashboard — assignment requests + disputes |
| Director | maya@newjerseyegypt.com (Mohamed Adel) | Same manager tools as Reem |

### Seed scenarios

- **Draft Broker Co** — DRAFT lead in Operations Hub
- **Delta Properties** — OPEN_RACE with Karim's pending assignment request
- **Aqar Misr** — ASSIGNED; Tantawy (primary) + Karim (co-pilot)
- **Nile Brokers** — PENDING_AUDIT with all three documents uploaded
- **Pyramids Realty** — VERIFIED with complete compliance data

## Scripts

- `npm run dev` — start dev server
- `npm run dev:clean` — delete `.next` cache and start dev (fixes stale chunk errors)
- `npm run db:migrate` — apply Prisma migrations
- `npm run db:seed` — seed demo users and agencies
- `npm run db:reset` — reset DB and re-seed

## Troubleshooting

If you see `Application error`, `Cannot find module './XXX.js'`, or favicon 500s after pulling changes:

```bash
# Stop the running dev server first (Ctrl+C)
npm run dev:clean
npm run db:seed
```

This clears a stale Next.js webpack cache, which is the usual cause after schema or route changes.

## Environment

Copy values from `.env`:

```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

## Deployment (VPS)

App path: `/var/www/sales-arena`  
Domain: `sales-arena.duckdns.org`  
Port: `3005` (PM2 + Nginx)

### First-time VPS setup

```bash
cd /var/www/sales-arena
cp .env.example .env
nano .env   # set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

npm ci
npm run db:deploy
npm run db:seed          # optional demo data
npm run build
pm2 start ecosystem.config.cjs
pm2 save
bash deploy/vps-healthcheck.sh
```

### Every deploy (pull + migrate + build + reload)

```bash
cd /var/www/sales-arena
bash deploy/vps-deploy.sh
```

Or manually:

```bash
git pull origin main
npm ci
npm run db:deploy
npm run build
pm2 reload sales-arena
bash deploy/vps-healthcheck.sh
```

### Live testing

See **[deploy/live-test-checklist.md](deploy/live-test-checklist.md)** for a full role-by-role walkthrough (Ops, Sales, Manager, Archive, SLA).

Quick smoke after deploy:

```bash
bash deploy/vps-healthcheck.sh
npm run db:list-users
npx prisma migrate status
```

### Local machine — push before VPS deploy

```bash
git add -A
git status                 # exclude .cursor/ if present
git commit -m "Enterprise pipeline + SLA, archive, duplicate notify UX"
git push origin main
```
