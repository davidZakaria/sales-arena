# BRM Platform Guide — New Jersey Developments

**Broker Relationship Management (BRM)** prototype for managing broker agencies, lead intake, manager-led assignment, compliance documents, and Expression of Interest (EOI) finance clearance.

This document is the **single shareable reference** for what the app does today, how workflows operate, demo credentials, deployment, and what is planned next. It reflects the codebase as of **August 2026** (Model B assignment + role-scoped search).

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Technology stack](#2-technology-stack)
3. [Assignment model — Model B (current)](#3-assignment-model--model-b-current)
4. [Agency lifecycle & statuses](#4-agency-lifecycle--statuses)
5. [Roles & permissions](#5-roles--permissions)
6. [Features by screen](#6-features-by-screen)
7. [Inbound lead channels](#7-inbound-lead-channels)
8. [Compliance vault workflow](#8-compliance-vault-workflow)
9. [EOI & Finance pipeline](#9-eoi--finance-pipeline)
10. [Search & visibility rules](#10-search--visibility-rules)
11. [Broker contacts & self-registration](#11-broker-contacts--self-registration)
12. [Internationalization & UX](#12-internationalization--ux)
13. [Demo accounts & seed scenarios](#13-demo-accounts--seed-scenarios)
14. [Deployment & environments](#14-deployment--environments)
15. [Database overview](#15-database-overview)
16. [API & automation endpoints](#16-api--automation-endpoints)
17. [Recent release history](#17-recent-release-history)
18. [Known limitations & legacy code](#18-known-limitations--legacy-code)
19. [Future development roadmap](#19-future-development-roadmap)
20. [Demo walkthrough scripts](#20-demo-walkthrough-scripts)

---

## 1. Executive summary

BRM is an internal web application for **New Jersey Developments** to:

- **Capture** broker leads from Operations, public registration, WhatsApp, and CSV import
- **Qualify** leads in Operations before releasing them to managers
- **Assign** leads to sales reps through the **manager assignment queue** (sales do not self-claim)
- **Collect** Tax ID, Commercial Register, and signed contract **files** from sales
- **Verify** compliance in Operations and activate verified broker agencies
- **Track** Expressions of Interest (EOIs) through a dedicated Finance clearance queue
- **Monitor** live property inquiries, co-pilot disputes, and team performance on the Manager Dashboard
- **Respond** to WhatsApp property requests via the **Inquiry Hub** and **Inventory Template Library**

**Important:** This is a **prototype / demo** built for executive presentations and workflow validation. It uses SQLite locally, mock file uploads, and simplified auth — not production-grade multi-tenant security.

**Live demo (when deployed):** https://sales-arena.duckdns.org  
**Repository:** https://github.com/davidZakaria/sales-arena.git

---

## 2. Technology stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | SQLite (MVP) via Prisma ORM 7 |
| Auth | NextAuth.js (email/password, local accounts) |
| i18n | next-intl — English (`/en`) and Arabic (`/ar`) |
| Hosting | VPS + PM2 (port 3005) + Nginx reverse proxy |

**Key paths in repo:**

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | Data model |
| `prisma/seed.ts` | Demo users, agencies, EOIs |
| `src/app/[locale]/` | Localized routes |
| `src/lib/actions/` | Server actions (mutations) |
| `src/lib/agency/permissions.ts` | Role-based agency access |
| `deploy/` | VPS scripts, healthcheck, webhook test |
| `messages/en.json`, `messages/ar.json` | UI copy |

---

## 3. Assignment model — Model B (current)

### What Model B means

Operations **does not** publish leads to a sales “marketplace.” Instead:

1. **Operations** intakes and validates leads (DRAFT)
2. **Operations** sends vetted leads **to the manager** (`Send to manager`)
3. **Manager / Director** assigns each lead to a **sales rep** from `/manager` or the agency page
4. **Sales** only see agencies assigned to them (portfolio + scoped search)
5. **CSV bulk import** creates DRAFT rows only — **no auto-assign** from a Sales column

### What was removed / deprecated in UI

| Old behavior (Model A) | Current behavior (Model B) |
|------------------------|----------------------------|
| Sales browse **Open Race Market** | `/open-race` redirects: managers → `/manager`, sales → `/portfolio` |
| Sales **request assignment** | Removed — manager assigns proactively |
| Ops **Publish to Open Race** button label | **Send to manager** (same `OPEN_RACE` DB status) |
| CSV **Sales column auto-assign** | All imports stay **DRAFT** |
| Global search shows all agencies to everyone | **Role-scoped search** (see §10) |

### UI label for `OPEN_RACE` status

The database enum value remains `OPEN_RACE` for compatibility, but the product copy reads:

- **English:** “Awaiting assignment” / “Sent to manager”
- **Arabic:** “بانتظار التعيين”

Meaning: *Ops released the lead; manager must pick a sales rep.*

---

## 4. Agency lifecycle & statuses

```
DRAFT → OPEN_RACE → ASSIGNED → PENDING_AUDIT → VERIFIED
                                              ↘ (return) → ASSIGNED
Any active status → ARCHIVED (terminal, hidden from lists)
```

| Status | Who acts | Meaning |
|--------|----------|---------|
| `DRAFT` | Operations | Lead captured; not yet sent to manager. Needs name + phone before send. |
| `OPEN_RACE` | Manager / Director | In **manager assignment queue** — awaiting rep assignment |
| `ASSIGNED` | Sales (primary owner) | Rep owns the agency; uploading compliance docs |
| `PENDING_AUDIT` | Operations | All 3 required doc **files** uploaded; Ops verifies typed Tax ID / CR and approves |
| `VERIFIED` | — | Compliance cleared; agency active |
| `ARCHIVED` | Ops / Manager | Retired record; excluded from search and portfolios |

### Contract duration (new field)

- Optional free-text field on agency: `contractDuration` (e.g. `6 months`, `1 year`)
- Editable in **Compliance Vault** by sales (when allowed), managers, and Ops during audit
- Stored on `Agency.contractDuration`

### Compliance watch (assigned agencies)

- Operations **Compliance watch** flags **missing document files** only — not missing typed numbers

---

## 5. Roles & permissions

### Roles

| Role | Home route | Sidebar |
|------|------------|---------|
| `SALES` | `/dashboard` | Dashboard, My Portfolio, **Inquiries**, **Inventory Library** |
| `MANAGER` | `/dashboard` + `/manager` | Dashboard, Portfolio, Manager Dashboard (badge = unassigned leads + live inquiries), Inventory Library |
| `DIRECTOR` | Same as Manager | Same; can assign to **all** sales reps |
| `OPERATIONS` | `/operations` | Operations Hub only |
| `FINANCE` | `/finance` | Finance Hub only |

### Capability matrix (current)

| Capability | Sales | Operations | Manager | Director | Finance |
|------------|-------|------------|---------|----------|---------|
| Create agency / draft lead | No | **Yes** | No | No | No |
| Send DRAFT → manager queue | No | **Yes** | No | No | No |
| Assign lead to rep | No | No | **Yes** (team) | **Yes** (all reps) | No |
| Browse unassigned leads | **No** | Yes | **Yes** | Yes | Read-only via Ops context |
| Upload compliance **files** | Primary owner | No | Override | Override | No |
| Type Tax ID / CR in vault | No | **Yes** (audit) | Yes | Yes | No |
| Verify → VERIFIED | No | **Yes** | No | No | No |
| Submit EOI | Primary + co-pilot | No | No | No | No |
| Verify / reject / convert EOI | No | **No** | No | No | **Yes** |
| Archive agency | No | Yes | Yes | Yes | No |
| Manage co-pilots | Primary (limited) | No | Yes | Yes | No |
| File assignment dispute | Non-owner on others’ ASSIGNED | No | No | No | No |

### Agency page access (sales)

Sales **cannot open** agency profiles for `DRAFT` or `OPEN_RACE` leads they do not own (404). They only see their portfolio agencies plus disputed-assignment edge cases on others’ `ASSIGNED` agencies.

---

## 6. Features by screen

### `/operations` — Operations Command Center

**Tabs:** Overview · Intake & Drafts · Audit Queue · Pipeline Watch · Activity Log

| Feature | Description |
|---------|-------------|
| **Draft leads table** | All `DRAFT` agencies; **Send to manager** (requires name + phone) |
| **Create lead form** | Manual intake with duplicate phone/WhatsApp detection + Notify Broker link |
| **CSV bulk upload** | Imports rows as **DRAFT only**; skips duplicates |
| **Awaiting assignment table** | Agencies in manager queue (`OPEN_RACE`) |
| **Audit queue** | `PENDING_AUDIT` agencies for Ops review |
| **Compliance watch** | Assigned agencies **missing Tax ID, CR, or Contract file uploads** |
| **Pipeline cards** | Counts: Draft · Awaiting assignment · Assigned · Pending audit · Verified · Archived |
| **Inbound / downstream signals** | Counts by source; EOI status summary + link to Finance (read-only) |
| **Activity log** | Recent audit entries across all agencies |

### `/manager` — Manager Dashboard

| Section | Description |
|---------|-------------|
| **Metrics** | Live inquiries · Leads awaiting assignment · Team EOIs pending Finance |
| **Live inquiries queue** | WhatsApp property requests (`Inquiry` NEW) — assign to rep |
| **Lead assignment queue** | `OPEN_RACE` leads with per-row **Assign to rep** dropdown |
| **Team assignments** | All team agencies (`ASSIGNED` / `PENDING_AUDIT` / `VERIFIED`) with rep and status |
| **Disputed assignments** | Co-pilot disputes on others’ agencies |
| **Team EOIs pending Finance** | EOIs awaiting clearance |
| **Broker EOI performance** | Volume and clearance stats by broker contact |

Managers can also **assign inline** on an `OPEN_RACE` agency detail page (Account Team card).

### `/dashboard` — Sales / Manager personal pipeline

| Feature | Description |
|---------|-------------|
| **Metrics** | Action required · Pending audit · Verified · (Managers only) Leads awaiting assignment · EOIs pending Finance |
| **Needs immediate action** | Assigned + pending audit agencies for the viewed user |
| **Pending EOIs table** | User’s EOIs awaiting Finance |
| **Manager overlay** | `?user={id}` — view another rep’s dashboard (manager/director only) |

Sales **do not** see the “leads awaiting assignment” metric.

### `/portfolio` — My Portfolio

- Agencies where user is **primary owner** or **co-pilot**
- Cards show location, role badge, status, contract status
- Co-pilot cards show **Primary owner: {name}**
- Manager can view rep portfolio via search → user or `?user=`

### `/inventory` — Inventory Template Library

**Roles:** Sales · Manager · Director

| Feature | Description |
|---------|-------------|
| **Template grid** | Pre-approved project messages (title, project, body, optional PDF link) |
| **Copy to clipboard** | Sales copy message text for WhatsApp |
| **Create template** | Manager/Director only — add new active templates |

### `/inquiries` — Inquiry Response Hub

**Roles:** Sales only

| Feature | Description |
|---------|-------------|
| **Assigned inquiries table** | Property requests assigned by manager (`Inquiry` status `ASSIGNED`) |
| **Respond dialog** | View broker message · pick inventory template · edit textarea · Launch WhatsApp · Mark responded |

### `/agency/[id]` — Agency profile

**Left column:** Agency info (phone, location, lead source) · **Account Team** card  
**Right column:** Tabs — Compliance · Broker contacts · EOIs · Activity log

| Account Team card | Primary owner · Manager · Director · Co-pilots · Inline assign (if unassigned) |
| Compliance Vault | 3 document slots (Tax ID, CR, Contract) · typed fields · contract duration · Ops verify/return |
| Broker contacts | Directory per agency; link EOIs to broker |
| EOIs | Submit (assigned/verified) · status badges |
| Activity log | Human-readable audit timeline |

### `/finance` — Finance Hub

| Feature | Description |
|---------|-------------|
| **EOI clearance queue** | `PENDING_FINANCE` EOIs |
| **Verified tab** | Cleared EOIs awaiting conversion |
| **Actions** | Verify funds · Reject (notes required) · Convert to contract |

Finance has **read-only** access to agency/EOI context — cannot edit compliance vault.

### Public routes (no login)

| Route | Purpose |
|-------|---------|
| `/join` | Broker self-registration → creates **DRAFT** with `PUBLIC_PORTAL` source |
| `/broker-join/[token]` | Sub-broker self-add to agency directory via invite token |
| `/login` | Sign in |

### `/open-race` — Legacy redirect only

No marketplace UI. Redirects to `/manager` or `/portfolio`.

---

## 7. Inbound lead channels

| Source | Enum | How it enters |
|--------|------|---------------|
| Manual Ops entry | `OPERATIONS` | Create lead form on Operations Hub |
| CSV bulk | `OPERATIONS` | Bulk upload → DRAFT |
| Public portal | `PUBLIC_PORTAL` | `/join` registration form |
| WhatsApp webhook (broker lead) | `WHATSAPP` | `POST /api/webhooks/whatsapp` with `brokerName` + `phone` → Agency **DRAFT** |
| WhatsApp webhook (property inquiry) | — | Same endpoint with `type: "INQUIRY"`, `brokerPhone`, `message` → **Inquiry NEW** |

**Two WhatsApp payload types, one endpoint:**

```json
// Broker onboarding (existing)
{ "brokerName": "...", "phone": "+2010...", "message": "..." }

// Property inquiry (new)
{ "type": "INQUIRY", "brokerPhone": "+2010...", "message": "...", "agencyId": "optional" }
```

**Duplicate handling:** Matching `repPhone1` or WhatsApp link skips creation; user-friendly message on `/join`; Ops sees duplicate alert with optional WhatsApp notify link.

**WhatsApp webhook auth:** Bearer token must match `WHATSAPP_WEBHOOK_SECRET` in `.env`.

---

## 8. Compliance vault workflow

### Required document files (sales upload)

1. **Tax ID card** (`TAX_ID`) — photo or PDF  
2. **Commercial Register card** (`COMMERCIAL_REGISTER`) — photo or PDF  
3. **Signed contract** (`CONTRACT`) — PDF  

Upload uses **mock storage** (filename recorded in DB, not real S3).

### Flow

1. Sales (primary owner) uploads files while `ASSIGNED`
2. When all three types exist → auto-transition to **`PENDING_AUDIT`**
3. Operations opens agency in **Audit Mode** — types Tax ID & CR from documents, sets contract signed
4. **Verify & Complete** → `VERIFIED`
5. **Return to sales** → back to `ASSIGNED` with optional reason

### Ops compliance watch

Lists **assigned** agencies where any of the three **files** is still missing (not whether typed numbers exist).

### Contract duration

Free-text field saved independently; useful for 6-month vs 1-year contracts in demos.

---

## 9. EOI & Finance pipeline

**EOI** = Expression of Interest — a sales-submitted deal record pending finance verification.

```
Sales submits EOI → PENDING_FINANCE → Finance verifies → VERIFIED → Convert to contract → CONVERTED
                                    ↘ REJECTED
```

| Field | Notes |
|-------|-------|
| Client, project, amount | Required |
| Broker contact | Required — must pick from agency directory |
| Payment reference / receipt | Mock file URL |

**Segregation:** Operations **cannot** approve EOIs. Finance **cannot** edit compliance. Co-pilots may submit EOIs alongside primary owners.

---

## 10. Search & visibility rules

**Omni-search** (⌘K / header search bar) calls authenticated `/api/search`.

| Role | Users in search | Agencies in search |
|------|-----------------|-------------------|
| **Sales** | Self only | Own agencies (primary + co-pilot) |
| **Manager** | Self + direct-report sales reps | Team agencies + **unassigned queue** (`OPEN_RACE`) |
| **Director** | All users | All non-archived agencies |
| **Operations / Finance** | All users | All non-archived agencies |

**Agency result subtitle shows:** status · assigned rep (or “Unassigned”) · location/type.

Archived agencies are **excluded** from search.

---

## 11. Broker contacts & self-registration

- Each verified/assigned agency can maintain a **broker contacts** directory
- EOIs must attribute a **broker contact**
- **Invite link** (`brokerInviteToken`) lets sub-brokers register via `/broker-join/[token]`
- Demo tokens: `/en/broker-join/demo-invite-aqar-misr`, `demo-invite-pyramids`

**Manager view:** Broker EOI performance table aggregates EOI stats by contact across the team.

---

## 12. Internationalization & UX

- Routes prefixed with locale: `/en/...`, `/ar/...`
- Locale switcher in header (full page navigation — avoids React hydration issues)
- RTL layout support for Arabic
- Theme toggle (light/dark)
- Responsive layouts: mobile sidebar drawer, touch-friendly controls
- Status badges with semantic colors across pipeline states

---

## 13. Demo accounts & seed scenarios

**Password for all users:** `brm123456`

| Role | Email | Demo focus |
|------|-------|------------|
| Director | `maya@newjerseyegypt.com` | Full manager tools + all sales reps for assign |
| Manager | `reem@newjerseyegypt.com` | Lead queue (3 leads) · team roster · SLA · disputes |
| Operations | `ops@newjerseyegypt.com` | Drafts · send to manager · audit queue · compliance watch |
| Finance | `finance@newjerseyegypt.com` | EOI clearance · verify · reject · convert |
| Sales | `tantawy@newjerseyegypt.com` | Aqar Misr · Nile · Pyramids — uploads & EOIs |
| Sales | `karim@newjerseyegypt.com` | Co-pilot on Aqar Misr · Heliopolis assigned |
| Sales | `yasmine@newjerseyegypt.com` | Red Sea audit · Oasis dispute |

### Seed agencies (highlights)

| Agency | Status | Notes |
|--------|--------|-------|
| Draft Broker Co | DRAFT | Portal-style draft |
| WhatsApp Lead Demo | DRAFT | WhatsApp source |
| Delta / Cairo Gate / North Coast | OPEN_RACE | Manager assignment queue |
| Aqar Misr | ASSIGNED | Missing docs · Tantawy primary · Karim co-pilot · contract duration `6 months` |
| Heliopolis Partners | ASSIGNED | Partial compliance · `1 year` duration |
| Nile / Red Sea | PENDING_AUDIT | In Ops audit queue |
| Pyramids Realty | VERIFIED | Full vault · converted EOIs |
| Oasis Estates | ASSIGNED | SLA breach + dispute demo |
| Legacy Broker (archived) | ARCHIVED | Hidden from lists |

Refresh demo data:

```bash
npm run db:seed
```

---

## 14. Deployment & environments

### Environment variables

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://sales-arena.duckdns.org"
WHATSAPP_WEBHOOK_SECRET="..."   # optional, for webhook
```

### Local development

```bash
npm install
npm run db:migrate    # or db:deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000 → redirects to `/en/login`.

### VPS production

| Item | Value |
|------|-------|
| Path | `/var/www/sales-arena` |
| Domain | `sales-arena.duckdns.org` |
| Process | PM2 `sales-arena` on port **3005** |
| Proxy | Nginx |

**Deploy after pull:**

```bash
cd /var/www/sales-arena
git pull origin main
npm ci
npm run db:deploy
npm run build
pm2 reload sales-arena
bash deploy/vps-healthcheck.sh
```

Optional fresh demo: `npm run db:seed`

---

## 15. Database overview

### Core models

| Model | Purpose |
|-------|---------|
| `User` | Staff accounts; hierarchy via `managerId` |
| `Agency` | Broker agency record; pipeline status; compliance fields |
| `ComplianceDocument` | Uploaded file metadata by type |
| `EOI` | Expression of Interest; finance workflow |
| `BrokerContact` | People at an agency |
| `AuditLog` | Append-only activity text per agency |
| `AssignmentRequest` | **Legacy table** — sales request flow (see §18) |
| `Inquiry` | WhatsApp property request; manager assign → sales respond |
| `InventoryTemplate` | Pre-approved reply templates for sales |

### Key agency fields

| Field | Purpose |
|-------|---------|
| `status` | Pipeline state |
| `primaryOwnerId` | Assigned sales rep |
| `source` | Inbound channel |
| `contractDuration` | Free-text contract term |
| `claimExpiresAt` | Legacy field (unused in UI) |
| `isDisputed` | Co-pilot dispute flag |
| `brokerInviteToken` | Public sub-broker invite |

---

## 16. API & automation endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/search?q=` | GET | Session | Role-scoped omni-search |
| `/api/webhooks/whatsapp` | POST | Bearer secret | Inbound WhatsApp lead → DRAFT |
| `/api/auth/[...nextauth]` | * | NextAuth | Login/session |

**Test WhatsApp locally:**

```bash
bash deploy/test-whatsapp-webhook.sh http://127.0.0.1:3000
```

---

## 17. Recent release history

| Commit | Summary |
|--------|---------|
| `0a6046f` | Role-scoped search; manager team roster; inline assign; consolidated Account Team |
| `5801a6a` | **Model B:** manager lead queue, send-to-manager, contract duration, CSV draft-only |
| `698cc9a` | Per-document compliance slots; Ops missing-**file** watch |
| `04af7e9` | i18n EN/AR, Finance Hub, EOI pipeline, WhatsApp webhook, theming, expanded seed |
| `65c45d4` | Enterprise Ops pipeline, SLA, archive, deploy tooling |

---

## 18. Known limitations & legacy code

### Prototype / MVP constraints

- **SQLite** — single-file DB; not suited for high concurrency production
- **Mock file uploads** — no real document storage or virus scan
- **Local auth only** — no SSO, MFA, or password policies
- **No email/SMS notifications** — queues are in-app only
- **No real WhatsApp Business API integration** — webhook stub only
- **No reporting/export** — dashboards are operational, not BI

### Legacy from Model A (still in codebase / DB)

| Item | Status |
|------|--------|
| `AssignmentRequest` model + seed audit logs (“requested assignment”) | DB exists; **no active UI** after Model B |
| `OPEN_RACE` enum name | Kept; UI says “Awaiting assignment” |
| `/open-race` route | Redirect only |
| `open-race-card.tsx` | Unused component may remain |
| README.md & `deploy/live-test-checklist.md` | **Partially outdated** — still mention Open Race marketplace and assignment requests in places |

### Docs superseded by this file

Use **this guide** as the canonical product reference until README and live-test-checklist are updated to Model B.

---

## 19. Future development roadmap

Prioritized items aligned with product direction and gaps identified during build:

### High priority

| Item | Description |
|------|-------------|
| **Assignment request flow (optional)** | Re-enable sales “request lead” with manager approve/reject UI — if business wants hybrid Model A+B |
| **Real file storage** | S3/Azure blob for compliance docs and EOI receipts |
| **Notifications** | Email or WhatsApp when lead assigned, audit returned, EOI rejected |
| **Update README & live-test-checklist** | Align all docs to Model B workflows |
| **Production database** | PostgreSQL + Prisma migrate; connection pooling |

### Medium priority

| Item | Description |
|------|-------------|
| **Manager filters on team roster** | Filter by rep, status, SLA, location |
| **Ops dashboard metrics export** | CSV export of pipeline counts |
| **Broker portal login** | Brokers view their own submission status |
| **Contract duration enums** | Replace free-text with structured 6mo / 12mo + expiry dates |
| **Audit log i18n** | Localized activity summaries in AR |
| **Remove dead code** | AssignmentRequest UI components, OpenRaceCard, unused i18n keys |

### Lower priority / later phases

| Item | Description |
|------|-------------|
| **Territory / agency type rules** | Auto-suggest rep by location or broker tier (A/B/C) |
| **Multi-developer tenancy** | Separate orgs in one deployment |
| **Mobile app or PWA** | Field sales upload from phone camera |
| **Integration with CRM/ERP** | Sync verified agencies and converted EOIs |
| **Advanced analytics** | Funnel conversion, rep leaderboard, broker ranking |
| **WhatsApp two-way** | Status replies to brokers from Ops templates |

### Explicitly out of scope (current prototype)

- Instant claim / competitive Open Race between sales reps  
- Sales typing Tax ID or Commercial Register without Ops verification  
- Finance editing compliance documents  
- Operations approving EOI funds  

---

## 20. Demo walkthrough scripts

### A. End-to-end Model B (15 minutes)

1. **Operations** (`ops@…`) → Operations Hub → Intake tab  
   - Show draft leads · create or pick **Manual Ops Draft**  
   - **Send to manager** (note name + phone required)

2. **Manager** (`reem@…`) → Manager Dashboard  
   - **Lead assignment queue** → assign **Delta Properties** to Karim  
   - Show **Team assignments** table updating  
   - Optional: ⌘K search “Delta” — see status + assignee

3. **Sales** (`karim@…`) → Portfolio → open assigned agency  
   - Compliance Vault: upload 3 document slots  
   - Set **contract duration** (e.g. `6 months`)  
   - Status moves to **Pending audit** when complete

4. **Operations** → Audit Queue → Verify & Complete → **Verified**

5. **Sales** → Submit **EOI** with broker contact  
6. **Finance** (`finance@…`) → Verify funds → Convert to contract

### B. Inbound automation (5 minutes)

1. Open `/join` → register new agency  
2. Ops Hub → see **PUBLIC_PORTAL** draft  
3. (Optional) run WhatsApp webhook script → **WHATSAPP** draft

### C. Manager oversight (5 minutes)

1. Manager → SLA breached · Disputes · Broker EOI performance  
2. Search a sales rep → view their dashboard/portfolio via `?user=`

### D. Sales visibility check (2 minutes)

1. Sales ⌘K → confirm **only own agencies** appear  
2. Try direct URL to an `OPEN_RACE` agency → **404** (cannot browse queue)

---

## Document maintenance

When shipping major features, update this file sections:

- §3 Assignment model  
- §6 Features by screen  
- §17 Release history  
- §19 Roadmap (move completed items out)

**Last updated:** August 2026 — Model B + role-scoped search (`0a6046f`)

---

*New Jersey Developments · Broker Relationship Management · Internal prototype documentation*
