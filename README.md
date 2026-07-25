# Backer — *Invest in People. Before the World Does.*

A working vanilla-web demo of **Backer**: the financial infrastructure underneath the
creator economy. Back creators at day zero — every position underwritten by an open
**Proof-of-Attention** protocol — and earn when they break out.

The product UI remains dependency-free HTML, CSS, and vanilla JavaScript. Production
analytics adds same-origin Vercel Node functions and Supabase PostgreSQL; it does not
migrate the frontend to a framework.

## Run it

```bash
cd "backer-site"
python3 -m http.server 8000
```

Then open **http://localhost:8000**

(Or just double-click `index.html` — it works on `file://` too.)

A convenience script is included:

```bash
./run.sh        # starts the server and prints the URL
```

This static server is enough for the product demo but not for `/api/*`, live view counts,
or the protected analytics dashboard. For analytics development, install Node.js 20+,
run `pnpm install`, configure a local `.env.local`, and use a Vercel-compatible local
server.

Run the automated analytics suite with:

```bash
pnpm lint
pnpm test
pnpm exec playwright install chromium # once on a fresh test machine
pnpm test:browser
```

## What's inside

```
backer-site/
├── backerdemo.html             # canonical marketing/product experience
├── backermarket.html           # standalone Backer Market
├── admin/analytics/            # protected dashboard shell
├── api/                        # Vercel analytics and admin functions
├── css/                        # Backer design system and page styles
├── js/                         # product, search, market, and analytics adapters
├── migrations/001_analytics.sql
├── tests/                      # core, API, and browser-facing behavior tests
└── vercel.json                 # routes, security headers, public count, retention cron
```

## The experience

**Marketing site** (scroll): the first-principles thesis, the broken-metrics problem,
the Proof-of-Attention algorithm (six outputs), the three product surfaces,
and who benefits.

**Interactive app** (Launch App / bottom dock):

- **AI Search Agent** — describe who you want to back in natural language; the agent
  "traverses" public data and ranks candidates by authenticity & trajectory.
- **Marketplace** — browse creators with live Authenticity Score, Retention Index,
  Engagement Quality, Velocity Flag, Monetization Propensity, and Growth Trajectory.
- **Creator detail** — the full underwriting view: authenticity ring, trajectory chart,
  milestone terms, an invest panel (from $1), and the **Backer AI** copilot.
- **Portfolio** — a proof-of-taste portfolio with a **Taste Grade**, performance history,
  and holdings. Toggle to **Creator** mode to "Start your Personal IPO."

Investments persist in `localStorage`, so positions you open show up in the portfolio.

## Privacy-preserving analytics

Backer keeps GA4 and its first-party analytics separate:

- Analytics is off until the visitor accepts it. Rejecting or revoking consent stops
  both GA4 and first-party collection.
- GA4 receives manual virtual page views and allowlisted product events. Backer never
  adds an IP-address field or attempts to retrieve raw IPs from GA4, and event payloads
  exclude signup details, search text, portfolio contents, and authentication data.
- The same-origin collector records canonical views, sessions, pseudonymous visitor
  estimates, and server-derived HMACed/masked IP estimates in PostgreSQL.
- Bots, retries, redirects, and market filter changes are excluded from default human
  counts.
- `/admin/analytics` uses a server-side secure cookie; dashboard data is never embedded
  in the public page.
- Exact-IP storage is off by default. The optional mode encrypts IPs with AES-256-GCM,
  limits reveals to a recent re-authenticated administrator, audits every reveal, and
  applies a seven-day deletion threshold through the daily retention job (normally
  removed within the following 24 hours).

The public badge starts at **2,049 on 2026-07-24 UTC**, adds **3 for each completed UTC
day**, and adds accepted natural human views. It exposes one cached aggregate number,
not visitor details.

Counts represent consented traffic and can differ from GA4 or server logs. Unique
visitors and unique IPs are estimates because of shared networks, VPNs, cookie
clearing, and multiple devices.

### Try this
1. On the landing hero, search **"AI researchers under 10K with very loyal audiences."**
2. Open **Kai Nakamura** → ask the AI **"Is this audience real?"**
3. Back him with **$25**, confirm settlement, then view your portfolio.
4. In the Marketplace, open **Jordan Cole** — the profile the protocol *flags* as fake.
   That contrast is the whole thesis: you can't invest where metrics can't be trusted.

## Deploy

The complete analytics build deploys on **Vercel** with **Supabase PostgreSQL**. Apply
the database migration, configure real server-side environment values, verify GA4 in
DebugView, and then deploy the validated commit. The exact setup, privacy review,
retention, verification, rollback, and key-rotation procedures are in
[`docs/ANALYTICS_DEPLOYMENT.md`](docs/ANALYTICS_DEPLOYMENT.md).

The existing `deploy.sh` is a legacy GitHub Pages helper. GitHub Pages can host a static
non-analytics preview, but it cannot execute the collector, natural view counter,
retention job, or protected administrator APIs. Do not use that helper for the
production analytics deployment.

## Notes

Illustrative demo only — not investment advice. Creator data, scores, and returns are
mocked for demonstration. Backing early creators carries real risk of total loss; that
framing is kept honest throughout the UI.

The analytics implementation is not a completed production installation until real
credentials are supplied, `migrations/001_analytics.sql` succeeds against the intended
database, GA4 is verified, Vercel production checks pass, and the marked company,
contact, and jurisdiction placeholders in `privacy.html` receive owner/legal review.
