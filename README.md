# Backer — *Invest in People. Before the World Does.*

A working, dependency-free demo of **Backer**: the financial infrastructure underneath the
creator economy. Back creators at day zero — every position underwritten by an open
**Proof-of-Attention** protocol — and earn when they break out.

No build step, no npm, no internet required. Pure HTML / CSS / vanilla JS.

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

## What's inside

```
backer-site/
├── index.html        # marketing landing (thesis, Proof of Attention, partners)
├── css/styles.css    # full design system (dark editorial fintech)
├── js/data.js        # mock creators, partners, the 6 algorithm outputs
└── js/app.js         # spectrum background, routing, app views, invest flow
```

## The experience

**Marketing site** (scroll): the first-principles thesis, the broken-metrics problem,
the Proof-of-Attention algorithm (six outputs), the three product surfaces,
who benefits, and the settlement partners.

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

### Try this
1. On the landing hero, search **"AI researchers under 10K with very loyal audiences."**
2. Open **Kai Nakamura** → ask the AI **"Is this audience real?"**
3. Back him with **$25**, confirm settlement, then view your portfolio.
4. In the Marketplace, open **Jordan Cole** — the profile the protocol *flags* as fake.
   That contrast is the whole thesis: you can't invest where metrics can't be trusted.

## Strategic partners (settlement & payments)

- **MoonPay** — fiat on-ramp / off-ramp
- **Sign** (backed by Binance) — on-chain attestation & milestone payouts
- **Infinipay** — programmable settlement rails / milestone escrow

## Notes

Illustrative demo only — not investment advice. Creator data, scores, returns, and
partner integrations are mocked for demonstration. Backing early creators carries real
risk of total loss; that framing is kept honest throughout the UI.
