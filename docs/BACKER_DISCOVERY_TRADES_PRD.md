# Backer Discovery + Trades — Product Contract

Status: implementation contract
Public host: GitHub Pages
Execution: simulation only

## 1. Product decision

Backer has two connected surfaces with different jobs:

| Surface | Route | Job | Data |
| --- | --- | --- | --- |
| Discovery | `backerdemo.html#market2` | Find real profiles and original work worth backing | Retained, source-linked public records |
| Trades | `backerdemo.html#trades` | Review simulated markets and locally drafted growth bets | Approved demo fixtures plus the user's local proposals |

Discovery never shows quotes, odds, positions, or an approved-market state. Trades never converts a public profile into a tradable market without a separate approval process.

## 2. Navigation

One shared floating dock appears on every public Backer page.

Expanded destinations:

1. Search — opens Discovery with search focused.
2. Discovery — opens the profiles-and-content feed.
3. Home — the Backer orb.
4. Trades — opens the simulated market board.
5. Portfolio — opens the user's local simulated positions.

Dock behavior:

- drag from the dock background, not from a destination button;
- clamp to the visible viewport and respect safe-area insets;
- snap to the nearest edge after release;
- minimize to the Backer orb and restore with one click;
- persist edge, normalized position, and minimized state on this device;
- keep click, keyboard focus, escape, resize, and reduced-motion behavior reliable;
- never cover the focused control or prevent page scrolling.

The dock keeps Backer's existing dark glass and orb language. It does not copy an iOS, Kalshi, or Polymarket layout.

## 3. Core flows

### Discover a subject

1. User opens a real creator or work card in Discovery.
2. Card preserves `Watch` and `Open source` as separate actions.
3. `Draft a bet` opens the composer with the exact creator/content IDs.
4. If the exact subject is no longer retained, the composer stops with `Subject no longer in the retained catalog`; it never substitutes another person.

### Draft a growth bet

The composer is subject-first, not event-first. The selected portrait or work remains visible through five short steps:

1. Subject — exact person or work.
2. Future claim — provider-native metric, direction, and target.
3. When — measurement cutoff, distinct from later review/resolution time.
4. Resolution — retained source, rule, and edge cases.
5. Review — plain-language claim and all proposal limits before save.

The composer supports a milestone or head-to-head proposal using:

- exact creator/content identity;
- a retained provider-native metric and observation;
- target, cutoff, and resolution rule;
- source URL and observation time.

Manual metrics may be saved only as an unverified idea. They are not resolution-ready.

Kalshi and Polymarket inform only the clarity of claim, outcome, timeline, rules, and final review. Backer does not adopt their event taxonomy, probability display, order book, wallet flow, or page structure. Backer outcomes use people-growth language such as `Reaches target / Does not reach target`.

Saving creates a local proposal, not a market:

- `status: local_draft`;
- `approvalStatus: discovery_proposal`;
- `executionMode: simulation`;
- lifecycle `DRAFT` or `OPENING_SOON`;
- quote, fee, stake, max loss, and payout are null.

### Review in Trades

Trades has three tabs:

1. Open simulations — approved deterministic demo contracts.
2. Your proposals — local drafts from Discovery.
3. Resolved — resolved demo simulations.

Proposal actions are `Review proposal`, `Edit`, and `Delete`. Only approved demo fixtures may expose `Open simulated position`.

## 4. Personalized ordering

Personalization is device-local and explainable. It uses only:

- watched creators;
- saved proposals;
- simulated positions;
- recently opened creators, works, and categories.

Ordering priority:

1. exact watched/drafted subjects;
2. matching provider/category interests;
3. fixture evidence recency for simulations, while proposals keep their retained observation time;
4. deterministic default rank.

The UI labels this `For you · on this device`. No hidden profile, ad targeting, or server-side identity is implied.

## 5. Data and storage

Discovery source of truth: `data/discovery-catalog.json`.
Approved demo source of truth: `js/market-data.js`.
The two datasets never merge.

Local proposal storage:

- keys: `backer_site_market_draft_v2:<id>` and `backer_site_market_draft_index_v2`;
- schema validation on every read/write;
- maximum 50 proposals, maximum item size, 90-day expiry, oldest-first pruning;
- localStorage first, sessionStorage fallback with `Saved for this tab only` disclosure;
- no cookies, auth tokens, or personal contact data;
- legacy draft read fallback only; new writes use v2.

Provider health is acquisition diagnostics, not trade evidence. General Discovery and Trades tickers do not announce unavailable providers. Filters contain retained sources; a connection action may appear separately when setup is required.

## 6. Routes

- `backerdemo.html#market2` — Discovery.
- `backerdemo.html#trades` — Trades.
- `backerdemo.html#trades?view=proposals&proposal=<id>` — local proposal inbox/detail state.
- `backercreate.html#draft?scope=person&person=<id>&source=discovery` — person proposal.
- `backercreate.html#draft?scope=content&person=<id>&content=<id>&source=discovery` — content proposal.
- `backermarket.html?draft=<id>&source=trades` — sanitized proposal preview.
- `backermarket.html?market=<fixture-id>&source=trades` — approved simulated terminal.

`#market-archive` and legacy `#market` canonicalize to `#trades`. Full proposal JSON never enters a URL.

## 7. Trust rules

- Public Discovery records remain `public_discovery` and `tradable=false` after a draft is created.
- Client input cannot approve a proposal or insert it into the fixture contract catalog.
- Drafting never writes `backer_portfolio_v1`.
- A retained observation is resolution-ready only when its entity, provider, metric, numeric value, source URL, and observation time all match the selected subject.
- PoA or composite scores never settle a bet.
- GitHub Pages stores proposals only on the user's device; it has no approval or settlement service.
- Every Trades page visibly says `Demo simulations · no real money`.

## 8. Acceptance gates

1. Discovery and Trades are distinct routes and distinct datasets.
2. Every public page gets the same dock; active destination is correct.
3. Dock drag, snap, minimize, restore, persistence, resize, keyboard, and safe-area tests pass at 320, 390, 608, 900, and 1440 px.
4. A person and an arbitrary work open the composer with exact IDs; missing IDs fail closed.
5. Save, reload, edit, delete, and expiry behavior pass without changing the portfolio key.
6. A proposal appears only under `Your proposals`, with no price, odds, volume, backers, payout, or position control.
7. Approved demo fixtures still support the existing simulated-position flow.
8. Personalized ordering is deterministic and explains its device-local inputs.
9. Discovery contains no fixture profiles; Trades labels all fixtures and proposals honestly.
10. Public Pages artifact contains every required module and no local-only archive renderer.
11. Source, unit, integration, browser, accessibility, responsive, and rendered taste gates pass.
12. Live GitHub Pages routes, bytes, dock behavior, proposal flow, and rollback are verified after publish.

## 9. Non-goals

- real-money trading, settlement, custody, or payment;
- client-side market approval;
- fabricated provider records, metrics, prices, or odds;
- copying another product's information architecture;
- server-side personalization or cross-device sync in this release.
