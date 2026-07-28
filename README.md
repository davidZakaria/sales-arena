# BRM — Broker Relationship Management

MVP for managing broker agency relationships, compliance data, and Open Race assignments.

## Stack

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS + shadcn/ui
- Prisma ORM + SQLite (local MVP)
- NextAuth.js (local email/password accounts)

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
| Sales (Primary) | tantawy@newjerseyegypt.com | Owns most assigned agencies |
| Sales (Co-Pilot / Disputes) | karim@newjerseyegypt.com | Co-pilot on Aqar Misr; disputed Nile Brokers |
| Manager | reem@newjerseyegypt.com | Manager Dashboard → resolve disputes |
| Director | maya@newjerseyegypt.com (Mohamed Adel) | Same manager tools as Reem |

### Seed scenarios

- **Aqar Misr** — Tantawy (primary) + Karim (co-pilot)
- **Nile Brokers** — Tantawy (primary), disputed by Karim (visible on `/manager`)

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
