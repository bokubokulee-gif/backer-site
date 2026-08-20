# Backer analytics deployment

Backer’s complete analytics feature requires Vercel serverless functions and a Supabase-hosted PostgreSQL database. GitHub Pages can still preview the static site, but it cannot run `/api/*`, persist natural traffic, protect the administrator dashboard, or execute retention.

This repository is deployable code, not a completed production installation. Do not call the analytics system production-ready until the database migration has run, real environment values are configured, GA4 is verified in DebugView, the Vercel production deployment succeeds, and the owner has approved the privacy text.

## Architecture and public count

- Canonical HTML pages load the shared consent and analytics adapter.
- `POST /api/analytics/view` accepts consented, sanitized view events and derives the IP only at Vercel’s trusted boundary.
- Supabase PostgreSQL stores protected detailed events, pseudonymous hashes, sessions, daily rollups, admin sessions, and audit records.
- `/admin/analytics` is only a shell. Every data request still requires the signed `HttpOnly`, `Secure`, `SameSite=Strict` administrator cookie.
- GA4 receives separate, sanitized event payloads. Backer never adds an IP-address field to those payloads or attempts to retrieve raw IPs from GA4, and it excludes personal information from event parameters.
- `GET /api/analytics/public-count` remains disabled by default and is reserved for a
  later measured-count launch. The current public browser does not call it.

The number beneath the Backer logo is a scheduled display. It starts at 2,305 on
20 August 2026 UTC and adds 5 after each completed UTC day. It is computed locally,
is not measured traffic, and does not use the first-party collector or a third-party
counter. `PUBLIC_VIEW_COUNTS_ENABLED` controls whether the scheduled display mounts.

## 1. Prerequisites

- Node.js 20 or later
- A Vercel account authorized for the Backer repository
- A Supabase project in the intended production region
- A GA4 property and web data stream
- Owner/legal approval for the privacy notice and retention choices

Do not create accounts, change DNS, or enable exact-IP mode on someone else’s behalf. Keep all database, service-role, hashing, encryption, session, password, and cron values in server-side environment settings only.

## 2. Install and test

From the repository root:

```bash
pnpm install
pnpm lint
pnpm test
pnpm exec playwright install chromium
pnpm test:browser
```

The Chromium install is needed only on a fresh development or CI machine that does not
already provide a compatible Playwright browser. Do not add it to the production
Vercel build.

Use `.env.example` as the inventory for local values. Create a local `.env.local` if needed; `.env*` is ignored except for `.env.example`.

The API requires `DATABASE_URL`. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are reserved for a future Supabase API integration and can remain unset because the current implementation connects through PostgreSQL.

## 3. Create and migrate Supabase

1. Create the production Supabase project.
2. Copy a server-side PostgreSQL connection string from Supabase. Prefer the transaction/session pooler recommended for serverless workloads and require TLS.
3. Set `DATABASE_URL` locally only for the migration command.
4. Apply the versioned migration:

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_analytics.sql
   ```

5. Inspect the result before deploying. The migration must create the analytics tables and indexes, enable Row Level Security, revoke browser roles, and make `analytics_admin_audit` append-only except for its controlled 12-month retention path.

Run migrations intentionally and in order. Do not paste a service-role key, database URL, or migration output containing credentials into issues, browser JavaScript, logs, or screenshots.

## 4. Generate server secrets

Generate independent values; never reuse a key for two purposes.

```bash
openssl rand -base64 48
```

Run that separately for:

- `ANALYTICS_HASH_SECRET`
- `ANALYTICS_SESSION_SECRET`
- `CRON_SECRET`

Create the administrator password hash with the repository’s scrypt helper:

```bash
pnpm hash:admin-password
```

Enter a unique password of at least 14 characters and store only the resulting `scrypt$…` value as `ANALYTICS_ADMIN_PASSWORD_HASH`.

Leave `ANALYTICS_STORE_RAW_IP=false` and `ANALYTICS_IP_ENCRYPTION_KEY_B64` empty for the normal privacy-preserving deployment. If exact-IP mode is later approved, generate its required 32-byte key separately:

```bash
openssl rand -base64 32
```

## 5. Configure Vercel

Import the existing GitHub repository into Vercel or link it with an authenticated Vercel CLI. Keep the repository root as the project root and use the “Other” framework preset. The site has no frontend build output directory; Vercel serves the HTML/CSS/JS directly and discovers the Node functions under `api/`.

Add the following production environment values in Vercel:

### Required

- `GA4_MEASUREMENT_ID`
- `DATABASE_URL`
- `DATABASE_SSL=require`
- `DATABASE_SSL_REJECT_UNAUTHORIZED=true`
- `ANALYTICS_CONSENT_POLICY_VERSION=2026-08-20`
- `ANALYTICS_HASH_SECRET`
- `ANALYTICS_HASH_KEY_VERSION=v1`
- `ANALYTICS_ADMIN_PASSWORD_HASH`
- `ANALYTICS_SESSION_SECRET`
- `ANALYTICS_ALLOWED_ORIGINS`
- `CRON_SECRET`

`ANALYTICS_ALLOWED_ORIGINS` must contain exact origins with schemes, separated by commas—for example, the final production origin and explicit local development origin. Never use `*`, substring matching, or an origin without its scheme. Add an individual preview deployment origin only while testing that exact preview.

### Consent-version release invariant

`ANALYTICS_CONSENT_POLICY_VERSION` must exactly equal `POLICY_VERSION` in `js/analytics-core.js`, and that version must identify the privacy copy shipped in `privacy.html`. Review and bump all three in the same deployment whenever the notice changes. The browser intentionally keeps GA4 and the first-party collector off when the server and bundled versions differ; it will not write the server’s version against older bundled privacy copy. A previously stored decision becomes invalid when the bundled `POLICY_VERSION` changes and the visitor is asked again.

### Safe defaults

- `ANALYTICS_STORE_RAW_IP=false`
- `ANALYTICS_RAW_IP_RETENTION_DAYS=7`
- `ANALYTICS_EVENT_RETENTION_DAYS=90`
- `ANALYTICS_IP_RATE_LIMIT_PER_MINUTE=300`
- `ANALYTICS_VISITOR_RATE_LIMIT_PER_MINUTE=120`
- `ANALYTICS_ADMIN_IDENTITY=backer-admin`
- `ANALYTICS_ADMIN_SESSION_TTL_SECONDS=28800`
- `ANALYTICS_ADMIN_SESSION_IDLE_SECONDS=1800`
- `ANALYTICS_ADMIN_REAUTH_SECONDS=300`

The public-count feature is disabled by default in `vercel.json`:

- `PUBLIC_VIEW_COUNTS_ENABLED=false`

The current browser display never calls `/api/analytics/public-count`, even on a
dynamic deployment. It uses the reviewed local schedule documented in `privacy.html`:
2,305 on 20 August 2026 UTC, then 5 after each completed UTC day. The endpoint remains
available only for future measured-count work and must stay disabled until that work
is separately approved.

`vercel.json` also preserves existing `.html` URLs, rewrites `/admin/analytics` to its static shell, applies security/no-store headers, and schedules `GET /api/analytics/retention` daily at 03:17 UTC. Vercel Cron supplies `Authorization: Bearer $CRON_SECRET`; the endpoint rejects other requests.

## 6. Preview and production rollout

1. Deploy a Vercel preview.
2. Add that exact preview origin to `ANALYTICS_ALLOWED_ORIGINS` only if browser-level API testing is required, then redeploy the preview.
3. Run the checks below.
4. Deploy the validated commit to production through Vercel’s Git integration or:

   ```bash
   vercel deploy --prod
   ```

5. Add the final exact production origin to `ANALYTICS_ALLOWED_ORIGINS` and redeploy if it was not known earlier.
6. Verify the retention cron is listed in Vercel and inspect its first successful run without logging identifiers.
7. Change DNS only after the owner explicitly authorizes it.

Do not run the legacy `deploy.sh` for this workflow. It targets GitHub Pages, replaces the Git remote during its flow, and cannot deploy the server-side analytics system.

## 7. Production verification

Use a clean browser profile with developer tools open.

### Configuration and consent

1. Load `/api/config`. It may expose only the GA4 Measurement ID, consent policy version, and public-count feature flag.
2. Before responding to the consent banner, confirm there are no GA4 requests and no request to `/api/analytics/view`.
3. Choose **Reject** and confirm both systems remain silent.
4. Open **Privacy settings**, choose **Accept analytics**, and confirm exactly one initial first-party view plus one manual GA4 page view.
5. Navigate through home, search, market, and creator virtual views. Confirm one sanitized page view per screen and no view for market filter/sort changes.
6. Revoke consent and confirm both systems stop immediately without breaking navigation.

### Public count

1. Confirm the header display is 2,305 at `2026-08-20T00:00:00Z` and remains 2,305 until the next UTC midnight.
2. Confirm it becomes 2,310 at `2026-08-21T00:00:00Z` and adds exactly 5 after each later completed UTC day.
3. Confirm the browser makes no request to `/api/analytics/public-count` or any third-party counter.
4. Leave `/api/analytics/public-count` disabled until a separately approved measured-count release.

### Administrator dashboard

1. Open `/admin/analytics` signed out; no summary or recent data should be visible.
2. Sign in and exercise Today, 7-day, 30-day, 90-day, and a custom range.
3. Confirm the dashboard handles loading, empty, error, and expired-session states.
4. Switch Local/UTC display, export CSV, and confirm the CSV has masked IPs only.
5. Log out and confirm all protected data is cleared from the page and API reads return `401`.
6. Keep exact-IP mode off. The Recent views table must not show Reveal controls.

### GA4 DebugView

1. Use the localhost Vercel-compatible server with a real test Measurement ID; the adapter enables `debug_mode` only on localhost. A Vercel preview remains useful for production-shape checks but is intentionally not marked as GA debug traffic.
2. Accept analytics consent.
3. In GA4, open **Admin → Data display → DebugView**.
4. Confirm a single manual `page_view` for the initial screen and one per virtual route.
5. Exercise funnel interactions and confirm allowlisted events arrive once.
6. Inspect parameters: no email, name, handle, signup URL, search text, portfolio details, query string, authentication value, or IP may appear.
7. Repeat after rejecting consent; DebugView must receive nothing from that browser.

## 8. Retention and exact-IP mode

The daily job applies these retention thresholds:

- removes AES-GCM encrypted raw-IP material after 7 days;
- removes detailed page-view events and their HMACed IPs after 90 days;
- retains de-identified daily rollups indefinitely;
- removes administrator audit records after 12 months;
- clears expired rate-limit buckets and sessions.

Because the job runs once per day, removal normally completes within 24 hours after
the applicable threshold. Keep this operational grace period aligned with the public
privacy notice if the cron schedule changes.

Do not enable `ANALYTICS_STORE_RAW_IP=true` until the owner has documented a lawful basis, completed privacy/legal review, updated the notice, confirmed retention, and approved who may reveal an IP. When enabled:

1. Set `ANALYTICS_IP_ENCRYPTION_KEY_B64` to a newly generated 32-byte base64 key.
2. Increment `ANALYTICS_IP_ENCRYPTION_KEY_VERSION`.
3. Deploy and confirm eligible recent rows alone show Reveal controls.
4. Re-authenticate for each reveal workflow. Confirm the exact value appears one at a time, is absent from exports, and creates immutable requested/succeeded or failed audit records.
5. Disable the mode again when the approved operational need ends. Disabling reveals does not delay the scheduled deletion of already encrypted values.

## 9. Key rotation

### HMAC key

Rotate `ANALYTICS_HASH_SECRET` and increment `ANALYTICS_HASH_KEY_VERSION` together. Existing events retain their version, but the current implementation deliberately does not attempt to link identities across key versions. Cross-version unique counts can therefore increase around the rotation boundary; annotate the dashboard and choose a low-traffic boundary.

### IP encryption key

1. Generate a new 32-byte key.
2. Increment `ANALYTICS_IP_ENCRYPTION_KEY_VERSION` and set the new `ANALYTICS_IP_ENCRYPTION_KEY_B64`.
3. Temporarily provide still-needed old values through `ANALYTICS_IP_ENCRYPTION_KEYS_B64_JSON`, keyed by version. Treat the JSON as a secret.
4. After every event encrypted with an old key has passed the seven-day raw-IP window and retention has run successfully, remove that old key from the JSON map.

Never remove an old encryption key while an authorized reveal of its still-retained records is required. Never decrypt and re-store IPs merely to rotate a key.

### Sessions and administrator credential

Rotating `ANALYTICS_SESSION_SECRET` invalidates all administrator cookies, which is the intended emergency response. Generate a new scrypt password hash with `pnpm hash:admin-password` when rotating the administrator password.

## 10. Privacy and legal review

Before production, the owner or counsel must replace every marked placeholder in `privacy.html`, including:

- legal company name and contact address;
- controller/processor roles and GA4/Supabase/Vercel terms;
- jurisdiction, lawful basis, consent age, and regulator language;
- deletion/access request process and identity verification;
- whether exact-IP storage is legally and operationally justified;
- the final consent policy version and effective date.

The dashboard labels the data **First-party consented analytics** because ad blockers, consent choices, bot filtering, caching, and different identity models make it different from GA4 and server logs. Unique visitors and unique IPs remain estimates due to shared networks, VPNs, cookie clearing, and multiple devices.

## 11. Rollback and incident response

- Roll back application code with a previous Vercel deployment; do not destructively reverse the database migration during an incident.
- Set `PUBLIC_VIEW_COUNTS_ENABLED=false` in Vercel to hide the aggregate endpoint.
- Remove `GA4_MEASUREMENT_ID` to stop GA loading while preserving the first-party collector.
- Set `ANALYTICS_STORE_RAW_IP=false` immediately to stop new encrypted exact-IP collection and disable reveals.
- Rotate `ANALYTICS_SESSION_SECRET` to invalidate all administrator sessions.
- If a hashing or encryption key is suspected compromised, rotate it following the versioned process above and document the boundary.

Never include plaintext IPs, database URLs, cookies, passwords, keys, full referrer URLs, or query strings in incident logs.
