# Backer Market 2.1 Product Requirements

Status: Approved implementation specification
Date: 2026-08-12
Route: `backerdemo.html#market2`
Companion route: `backercreate.html`
Release mode: Simulated markets only
Owner: Backer product, design, data, and engineering

## 1. Product mandate

Market 2.1 must make people, their work, and the evidence behind their momentum feel investable without reducing a person to a generic event contract.

The experience hierarchy is:

`Person -> Linked accounts -> Work -> Native evidence -> Proof of Attention -> Market -> Position`

The user must understand four things in the first useful viewport:

1. Who is gaining attention.
2. What work caused it.
3. What evidence supports that claim.
4. Which market action is available.

Backer remains a trading platform. Familiar market conventions should reduce anxiety, but identity, work, consent, evidence, and source quality must remain visible around every trade.

## 2. Launch contract

- `#market2` remains the main Marketplace 2 route.
- `#market` remains available as the classic market.
- X, YouTube, Instagram, and GitHub are the core evidence providers.
- TikTok, Twitch, Spotify, SoundCloud, Substack, Patreon, Kick, Bilibili, Douyin, and other v1 platforms remain valid identity and filter concepts, but are labeled `profile_only` until an approved adapter exists.
- The launch is a clearly labeled simulation. No real money moves.
- Real public portraits and original work links are used. No AI-generated imagery is permitted.
- Provider credentials never ship to browser code.
- Missing credentials or permissions resolve to `permission_required`, not invented data.
- Public discovery never grants trading eligibility.

## 3. Product principles

### 3.1 People before contracts

The creator portrait, name, work, and why-now explanation precede price mechanics. The market is a way to express conviction in a person, not the person's identity.

### 3.2 Relationship before risk

`Watch` is the first commitment. `Your People`, saved views, alerts, and thesis notes create a durable relationship loop before a position is opened.

### 3.3 Evidence before interpretation

Platform metrics are shown with their native names, timestamps, access class, and source. Backer interpretation is labeled separately. Evidence is never presented as price, probability, consent, or settlement authority.

### 3.4 Familiar trading behavior

Market creation and position entry use conventions that prediction-market users already understand:

- precise question
- explicit outcomes
- displayed probability or price
- bid and ask where supported
- stake, fees, maximum loss, and possible payout
- written resolution source and cutoff
- review before confirmation
- receipt after a simulated fill

### 3.5 Friendly by default, rigorous on demand

Default language uses plain phrasing such as `Why people are noticing`, `Ways to back`, and `What could change`. An Advanced toggle reveals spread, liquidity, oracle rules, funding, margin, and risk limits.

## 4. Users and jobs

### Curious supporter

Wants to discover a real person, understand the work, Watch them, and learn the downside before risking money.

### Conviction builder

Wants comparable sources, honest date windows, recent and breakout work, and a clear distinction between attention and price.

### Active trader

Wants quote, side, size, liquidity, deadline, risk, rules, and a path to the full terminal without losing creator context.

### Creator or developer

Wants accurate representation, claim and correction controls, account-link approval, and an explicit opt-in boundary before any market becomes executable.

### Market proposer

Wants to create a measurable event on a creator or a piece of work, preview the settlement logic, and submit it without needing to understand market-operations jargon.

## 5. Information architecture

### 5.1 Market command layer preserved from v1

Market 2.1 retains these control families as a compact, data-driven layer:

1. Browse modes: Trending, New, Rising, Ending soon, Most backed, High PoA, Risk watch.
2. Categories: All, Knowledge, Gaming, Music, Business, Art and design, Technology.
3. Context strip: open simulated markets, closing soon, simulated volume, evidence coverage, provider warning, snapshot time.
4. Primary views: Markets, Creator Radar, Resolved.
5. Time windows: 24H, 7D, 30D, 90D.
6. Platforms: X, YouTube, Instagram, GitHub, plus labeled profile-only sources.
7. Quick filters: Open, Ending under 30d, Under 100K, Medium+ evidence, Multi-source, Watched.
8. Full Filters, Sort, Share.

Counts and volume must be computed from the current data set. Old fixture counts must never be reused as if live.

### 5.2 Desktop workspace

- Left, about 288px: people tape with portrait, platform marks, why-now line, native movement, freshness, market status, and Watch.
- Center: identity, latest and breakout work, original Proof of Attention entry, platform evidence ledger, and instrument board.
- Right, 312 to 336px: sticky position ticket, Your Market, Trending, Top movers, and Risk watch.
- The command layer should end near 320 to 360px from the top on a 1440px viewport.

### 5.3 Mobile workspace

- Two horizontal rails for browse/categories and range/platforms.
- Sticky Markets/Radar/Resolved row with Filter and Sort.
- Three to four people in a horizontal `Gaining now` carousel; the full roster opens in a sheet.
- Selected dossier begins immediately after the carousel.
- Four instrument modules become accordions.
- A bottom dock shows selected portrait, instrument, quote or state, and Trade or Watch.
- The ticket opens as a full-height sheet.

## 6. Creator dossier

The center dossier must show:

1. Real portrait, name, handle, category, identity confidence, claim state, and platform links.
2. Plain-language `Why people are noticing` narrative for the selected window.
3. Latest work and breakout work. Breakout means the strongest permitted native movement within the selected window, not simply the newest item.
4. Platform evidence ledger with native metrics, deltas, availability, and freshness.
5. Multi-source confirmation count without adding unlike platform metrics into a fake total.
6. The original Proof of Attention interface entry point.
7. Complete proposed structures for all four Backer instruments.

## 7. Original Proof of Attention requirement

Market 2.1 must preserve the existing full `PoaTerminal` experience as the canonical Proof of Attention interface.

Required entry points:

- `Open full Proof of Attention` in the creator identity header.
- `Open Proof of Attention` beside the evidence ledger.
- The simplified dossier summary may remain, but it cannot replace the full terminal.

The full interface retains:

- Public Attention Velocity history.
- PoA composition bands and confidence.
- source gaps, corrections, methodology changes, and event rail.
- content contribution and concentration context.
- strict separation between public attention, underwriting estimates, and traded prices.

## 8. Create market entry points

Every selected person exposes:

- `Create person-growth market`
- `Create content-growth market`

Every latest or breakout work card exposes:

- `Create market on this work`

These actions open `backercreate.html` with non-sensitive URL context:

`backercreate.html?scope=person&person=<personId>&source=market2`

or

`backercreate.html?scope=content&person=<personId>&content=<contentId>&source=market2`

The creation page loads the referenced public identity and work from the same Market 2 read model. The URL never contains provider tokens or private analytics.

## 9. Separate event-builder page

### Step 1: Choose the subject

- Person growth or content growth.
- Display the real portrait or work thumbnail, source platform, original link, and latest evidence timestamp.

### Step 2: Define the market

- Suggested templates: follower milestone, subscriber milestone, view milestone, engagement milestone, repository star milestone, contribution milestone, and head-to-head comparison.
- Market question must be specific, neutral, and answerable.
- Outcomes default to Yes/No, with multi-outcome available for PK markets.

### Step 3: Define measurement

- Native metric.
- Baseline value and timestamp.
- Target or comparison rule.
- Observation window and cutoff.
- Official source URL.
- Data-latency disclosure.

Unavailable or creator-authorized metrics cannot be selected unless an active consent record and provider permission exist.

### Step 4: Define resolution safeguards

- Resolution source.
- Grace period for provider delay.
- deletion/private-content handling.
- tie rule when relevant.
- void and refund rule.
- dispute window.

### Step 5: Market setup

- Instrument: Milestone or PK Market for the public composer. Creator Perps remain an approved internal product, not a user-created event.
- Close date.
- simulation liquidity preset.
- creator consent and policy state.
- clear notice when the proposal can only be saved as a draft.

### Step 6: Review

The review screen shows the exact question, outcomes, measurement, resolution source, dates, safeguards, and eligibility blockers. It includes `Edit` and `Create simulated market` actions.

### Step 7: Market page and position

After creation, the user lands on `backermarket.html?draft=<draftId>&source=builder`.

The market page follows familiar prediction-market behavior:

1. Choose an outcome or Long/Short where supported.
2. Choose Market or Limit.
3. Enter dollars or shares.
4. See current price, average price, fees, maximum loss, and possible payout.
5. Review the order.
6. Confirm the simulated position.
7. Receive a fill receipt with order ID, market ID, timestamp, and portfolio link.

Simulation drafts and positions are stored locally for the public demo. The schema must support an account-backed API later.

## 10. Instrument board

All four products appear together under `Ways to back <Person>` as substantive modules. Selecting one updates the right ticket and URL.

### Milestones

Show target, baseline, current observed value, progress, deadline, oracle, payout, evidence grade, and void rule.

### PK Market

Show both people or outcomes, exact comparison question, comparable metric, measurement window, source, bid/ask or proposed terms, and tie rule.

### Creator Arena

Show a friendly research comparison with both portraits, recent work, breakout work, reasons for movement, evidence coverage, and peer selector. Its executable layer points to a separately approved PK market.

### Creator Perps

Show creator attention index, dated movement series, mark and index separately, Long and Short, funding, margin, liquidation or maximum-loss explanation, open interest, and circuit-breaker state.

Discovery-only people still see the complete proposed module structure, followed by specific blockers. They must not see fabricated quotes.

## 11. Provider capability matrix

Availability classes:

- `public_app`: raw aggregate available through an approved server credential.
- `known_professional`: available for a known professional target through an authorized caller.
- `creator_authorized`: owner OAuth and consent required.
- `unsupported`: no official provider field.
- `not_returned`: provider omitted the field; never display zero.

### X

- Public post metrics: likes, replies, reposts, quotes, impressions, bookmarks.
- Public account metrics: followers, following, post count, listed count.
- Owner metrics: URL clicks, profile clicks, organic or promoted breakdown where permitted.
- Follower and post growth require Backer snapshots.
- `Subscribe` is not treated as a generic public X metric.

### YouTube

- Public video metrics: views, likes, comments.
- Public channel metrics: subscriber count when not hidden, total views, public video count.
- Subscriber counts are rounded by YouTube and must be labeled accordingly.
- Owner Analytics time series remain private unless the authorizing creator and YouTube policy expressly permit display.
- YouTube metrics remain raw and isolated. They are excluded from Backer cross-platform scores and market pricing unless Backer has written approval for the exact use.

### Instagram

- Known Professional Business Discovery: followers, media count, likes, comments.
- Creator-authorized Insights: saved, shares, reposts where supported, reach, views, follower time series.
- Consumer accounts and global trending people are unavailable through the official API.
- Missing insight values remain unavailable, never zero.

### GitHub

- Public user metrics: followers, public repositories.
- Public repository metrics: stars, forks, actual notification watchers through `subscribers_count`.
- `watchers_count` is a legacy star alias and must not be labeled Watchers.
- Authenticated GraphQL contribution totals can support real date ranges; restricted contributions are separated.
- Stars, forks, watchers, and follower growth require dated snapshots.
- There is no official GitHub Trending API. Backer discovery seeds must be labeled `Backer GitHub discovery`.

## 12. Data model

### 12.1 Identity graph

- One immutable Backer `personId` can own many source accounts.
- Display names never auto-merge accounts.
- Link confidence: `source_only`, `editorial_reviewed`, `creator_verified`.
- Creator claim can confirm, split, or remove account links.

### 12.2 Raw observation

```js
{
  observationId,
  syncRunId,
  personId,
  accountId,
  contentId,
  provider,
  subjectType,
  subjectId,
  metricKey,
  nativeMetricName,
  label,
  unit,
  kind,
  rawValue,
  availability,
  accessClass,
  consentId,
  providerTimestamp,
  observedAt,
  fetchedAt,
  freshUntil,
  staleAt,
  expiresAt,
  sourceUrl,
  policyVersion,
  rawHash
}
```

### 12.3 Window rollup

```js
{
  metricKey,
  window,
  effectiveStart,
  effectiveEnd,
  current,
  baseline,
  absoluteDelta,
  percentDelta,
  sampleCount,
  coverageRatio,
  state,
  methodVersion,
  observationIds
}
```

A movement claim requires a baseline and current observation or an explicit provider-native window or rank. `Newly observed` is distinct from `Rising`.

### 12.4 Public read model

The API returns one normalized UI contract:

```js
{
  schemaVersion: 2,
  generatedAt,
  request,
  dataState,
  providerStatus,
  people: [{
    personId,
    identity,
    accounts,
    attention: {
      window,
      headline,
      whyNow,
      platformEvidence,
      confirmation,
      confidence,
      ranking,
      provenance
    },
    relationship,
    tradability,
    markets
  }],
  marketCatalog,
  rightRail,
  nextCursor
}
```

## 13. Provider and API architecture

Flow:

`Official adapters -> immutable observations -> reviewed identity graph -> window rollups -> policy compiler -> API read model -> static last-good snapshot`

Required endpoints:

- `GET /api/market2/people`
- `GET /api/market2/person?id=<personId>`
- `GET /api/market2/markets`
- `POST /api/market2/drafts` in production; local-storage adapter in the public simulation.

The browser requests the API on initial load and whenever range, platform, view, or sort changes. GitHub Pages falls back to `data/market2-people.json`, visibly labeled with its snapshot time. `js/market2-data.js` is an emergency bundled fallback only.

Adapter states:

`live | stale_snapshot | unavailable | permission_required`

Provider state, person freshness, and metric availability are independent.

## 14. Database changes

Add or extend tables for:

- reviewed identity links
- immutable provider observations
- metric rollups
- creator consents and scopes
- market catalog
- outcomes
- oracle and settlement rules
- quotes and fills
- simulated positions
- market drafts
- deletion tombstones

Ingestion is technically unable to grant trading eligibility.

## 15. Eligibility and consent

Separate gates:

`discovery_eligible | proof_display_eligible | score_eligible | trade_eligible`

Trading requires:

1. Creator-verified identity link.
2. Active, unexpired trading consent.
3. Provider and commercial-use policy review.
4. Rights review.
5. Instrument-specific risk approval.
6. Written settlement source and rules.
7. Approved oracle and fallback.

Public profiles remain Watch and research only until every gate passes.

## 16. Retention loops

- Discover -> Watch -> new work or evidence alert -> return.
- Watch -> save thesis -> compare -> market-open alert.
- Market -> preview -> position -> evidence and risk updates -> manage -> resolve.
- Creator claim -> connect accounts -> improve coverage -> opt into reviewed market.
- Proposed event -> save draft -> review -> approval -> market-open alert.

## 17. Visual system

- Backer charcoal backgrounds, warm ivory text, amber primary accent.
- Green and red only for actual positive/negative market or risk states.
- 14 to 16px primary UI copy; mono only for metrics, prices, timestamps, IDs, and evidence grades.
- Real portraits and work thumbnails provide warmth.
- Connected surfaces and restrained dividers replace a wall of equal cards.
- Rounded containers are reserved for interactive modules.
- No casino glow, decorative gradients, generic three-card marketing grids, or AI-generated imagery.
- Motion communicates selection, filtering, review, and order confirmation; reduced-motion is respected.

## 18. Analytics

Track:

- command, category, platform, range, quick-filter, and sort changes
- creator and work selection
- full PoA opens
- create-person-market and create-content-market opens
- builder step completion, validation failures, draft creation, and abandonment
- instrument selection
- ticket side, order type, review, confirm, and receipt
- provider and stale-state views
- Watch, alert, thesis, and share actions

Analytics must never include provider credentials or private metrics.

## 19. Acceptance criteria

### Product

- `#market2` opens directly and `#market` remains intact.
- V1 browse, category, stats, view, range, platform, quick-filter, sort, and share families are present.
- Selecting a person updates dossier, original PoA context, instrument board, ticket, URL, and mobile dock.
- Latest and breakout work link to original sources.
- Person and content market buttons open the separate builder with correct context.
- Milestones, PK Market, Creator Arena, and Creator Perps are substantive visible modules.
- The builder validates measurement and settlement rules before draft creation.
- A created draft opens in the full market terminal and supports a complete simulated position flow.

### Data

- UI requests the API and falls back to a visibly dated static snapshot.
- One person can resolve across multiple source accounts.
- Window movement is based on real observations or disclosed provider-native ordering.
- Native metrics display their correct access and availability class.
- YouTube does not enter unapproved cross-platform ranking or pricing.
- Saves, reposts, hidden subscribers, and other unavailable values are never fabricated.

### Quality

- No Market 2 console or page errors.
- No horizontal overflow at 320, 390, 768, 1024, 1440, and 1920px.
- 44px minimum interactive targets on touch layouts.
- Keyboard, focus, dialog, sheet, and reduced-motion behavior work.
- Loading, live, partial, stale, empty, removed, and permission-required states are tested.
- Current Market, Portfolio, Search, home, and full PoA routes still work.

## 20. Release plan

1. Approve this PRD.
2. Freeze schema v2 and identity-link rules.
3. Connect the Market 2 browser to the API/static adapter.
4. Implement the richer command layer and creator evidence ledger.
5. Restore the full PoA entry points.
6. Build the four instrument modules.
7. Build and connect the separate event builder.
8. Validate every responsive, data, creation, and position state.
9. Commit only scoped Market 2 and builder changes.
10. Reconcile with current remote main without overwriting unrelated work.
11. Publish and verify GitHub Pages.
12. Open the live `backerdemo.html#market2` route for review.

## 21. Primary official references

### X

- https://docs.x.com/x-api/fundamentals/metrics
- https://docs.x.com/x-api/fundamentals/data-dictionary
- https://docs.x.com/x-api/fundamentals/rate-limits
- https://docs.x.com/x-api/getting-started/pricing
- https://docs.x.com/developer-terms/policy
- https://docs.x.com/developer-terms/restricted-use-cases

### YouTube

- https://developers.google.com/youtube/v3/docs/videos
- https://developers.google.com/youtube/v3/docs/channels
- https://developers.google.com/youtube/v3/docs/videos/list
- https://developers.google.com/youtube/analytics/reference/reports/query
- https://developers.google.com/youtube/analytics/metrics
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/derived-metrics

### Instagram

- https://www.postman.com/meta/instagram/overview
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- https://www.facebook.com/legal/automated_data_collection_terms

### GitHub

- https://docs.github.com/en/rest/repos/repos#get-a-repository
- https://docs.github.com/en/rest/activity/starring
- https://docs.github.com/en/rest/activity/watching
- https://docs.github.com/en/rest/users/users
- https://docs.github.com/en/graphql/reference/objects#user
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies
