# Backer Market 2 Product Requirements

Status: Approved implementation specification
Route: `backerdemo.html#market2`
Owner: Backer product, design, and engineering
Date: 2026-08-11
Foundation: Conviction Desk simulation

## Product mandate

Backer Market 2 must feel like discovering, understanding, and backing a person whose work is gaining attention. It must remain a credible trading product, but the first interaction should not feel like browsing a wall of event contracts.

The marketplace has three simultaneous jobs:

1. Help ordinary people discover creators they genuinely care about.
2. Help curious users understand why attention is moving and whether it is durable.
3. Let experienced users express a view through rigorous market instruments without losing the person, the work, or the proof behind the position.

The product object hierarchy is:

`Person -> Work -> Attention evidence -> Market instrument -> Position`

Contracts remain important, but they no longer define the first impression.

## Product thesis

Prediction markets begin with a question. Patreon begins with a relationship. Backer should begin with a person and then make a market around informed belief in that person.

Patreon's useful lesson is its relationship architecture, not its membership mechanics:

- The creator is the destination.
- Discovery should lead to a durable follow, not anonymous scrolling.
- A free or low-commitment relationship comes before a financial commitment.
- Creators should have control over how they are represented.
- Community discovery should feel curious and celebratory, not purely zero-sum.

Backer's translation is:

- `Watch` is the low-commitment action.
- `Your People` is the relationship layer.
- Recent and breakout work explain the person.
- Proof of Attention establishes trust.
- Trading instruments express conviction.

Official Patreon references:

- https://news.patreon.com/articles/discovery-on-patreon-is-driving-over-200-million-to-creators-per-year
- https://support.patreon.com/hc/en-us/articles/45256719857293-How-Patreon-s-network-works-for-members
- https://support.patreon.com/hc/en-us/articles/36972391815693-Your-updated-creator-page
- https://support.patreon.com/hc/en-us/articles/16433886029325-How-free-memberships-can-help-grow-your-community
- https://www.patreon.com/about

## Goals

### Primary goals

- Make the preferred Conviction Desk concept the production marketplace foundation.
- Show real public creators, developers, and real linked work from X, YouTube, Instagram, and GitHub.
- Let users filter people by platform and by `24H`, `7D`, `30D`, and `90D` evidence windows.
- Preserve the current market filter rail from screenshot 1.
- Preserve the current right-side market intelligence modules from screenshot 2.
- Show recent work, breakout work, and Proof of Attention when a person is selected.
- Keep Milestones, PK Market, Creator Arena, and Creator Perps fully available.
- Make the interface comfortable for ordinary fans while retaining professional market rigor.
- Launch as a new route at `#market2` without deleting the current `#market` route.

### Secondary goals

- Provide a production-shaped ingestion and database contract for all four platforms.
- Make source freshness, platform coverage, and consent status legible.
- Preserve last-good data when a provider is delayed.
- Support real creator claim, correction, and opt-out workflows in the schema.
- Create a graceful static snapshot fallback for GitHub Pages.

## Non-goals

- Production scraping or OCR of logged-in platform pages.
- Bypassing platform APIs, robots directives, access controls, or rate limits.
- Turning every discovered public profile into a tradable market.
- Presenting a Backer score as an executable price or probability.
- Combining YouTube API data into a cross-platform creator ranking before the required YouTube audit and derived-metrics approval.
- Downloading or caching YouTube audiovisual media.
- Replacing the dedicated market terminal.
- Removing the existing `#market` experience during this release.

## Design read

Reading this as: a redesign-overhaul of a high-frequency creator-investing product for everyday fans and experienced traders, with an amiable consumer-fintech layer over Backer's restrained dark editorial identity.

### Design dials

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 4`
- `VISUAL_DENSITY: 8`

Rationale:

- Variance 6 preserves the recognizable three-pane desk but gives the center dossier a richer editorial rhythm.
- Motion 4 supports selection, filtering, evidence changes, and trade feedback without turning the marketplace into a cinematic landing page.
- Density 8 keeps the product credible for active users, while plain language and progressive disclosure keep it approachable.

### Visual system

- Theme: dark only, matching Backer's current public demo.
- Background: `#08080a` and `#0d0d10`.
- Primary text: `#f5f3ee`.
- Secondary text: `#a6a39c` and `#6d6a64`.
- Accent: Backer amber `#e9bd86` and `#f4ab63`.
- Positive and negative colors are reserved for actual market movement, P&L, and resolved outcomes.
- Portraits and work thumbnails supply the warmth. The chrome remains restrained.
- Typography: Geist and Geist Mono inside Market 2, with existing Backer brand assets unchanged.
- Shape rule: compact soft panels at 14-18px, pill controls, circular or softly squared real portraits.
- Shadows: low-opacity tinted depth only where sticky elevation matters.
- No AI-generated imagery.
- No generic equal-card marketplace grid.
- No decorative status dots, gradients, casino glow, or red/green dominance.
- No em dash or en dash characters in visible Market 2 copy.

## Users and jobs

### Curious fan

"Show me who is gaining real attention, what they made, and a low-pressure way to follow before I risk money."

Needs:

- real portrait and recognizable identity
- latest and breakout work
- plain-language explanation
- Watch before Trade
- simple stake, maximum loss, and possible return

### Conviction builder

"Let me compare the person, the evidence, and the available market expression without switching tools."

Needs:

- common signal windows
- source dates and confidence
- clear separation of attention, probability, and price
- comparable evidence
- shareable filtered board

### Active trader

"Give me fast access to price, instrument, liquidity, deadline, risk, and the full terminal."

Needs:

- instrument tabs
- executable quote versus underlying attention
- trade ticket
- market status and risk rail
- direct terminal deep link

### Creator or developer

"Represent my work accurately, let me claim or correct my profile, and do not create a market without consent."

Needs:

- claim and correction status
- clear source attribution
- opt-out and removal path
- trading eligibility separate from public discovery

## Information architecture

### Primary navigation

The public demo's main marketplace entry points open `#market2` after launch. The old `#market` route remains available as the classic market.

Market 2 navigation keeps:

- Discover
- Creator Radar
- Resolved
- Your People
- Portfolio

### Instrument navigation

The selected creator's market area always exposes these exact products:

- Milestones
- PK Market
- Creator Arena
- Creator Perps

These are not hidden behind a generic `More` menu.

### Desktop composition

1. Compact command header with product context and search.
2. Sticky market filter rail from screenshot 1.
3. Three-pane Conviction Desk workspace.
4. Left pane: ranked people list.
5. Center pane: creator world, work, proof, and market context.
6. Right pane: trade ticket followed by market intelligence modules from screenshot 2.
7. Methodology and source disclosure below the workspace.

No fourth desktop column is introduced.

### Mobile composition

1. Compact search.
2. Horizontally scrollable platform and time filters.
3. Person list.
4. Selected creator dossier.
5. Latest and breakout work.
6. Proof of Attention summary.
7. Market intelligence stack.
8. Sticky selected-person trade ticket.

The mobile ticket must retain the selected portrait, instrument, price or term, and primary action.

## Screenshot 1 requirements: filter rail

The exact interaction families are preserved and adapted to people-first language.

### View tabs

- Markets
- Creator Radar
- Resolved

Each tab shows a real count from the current read model.

### Time filter

- 24H
- 7D
- 30D
- 90D

Time means `Signals observed`. It never changes a contract's close date.

### Platform filter

- All
- X
- YouTube
- Instagram
- GitHub

Multiple platforms can be selected. A person appears when at least one selected platform profile has coverage for the chosen window.

### Quick filters

- Open
- Ending under 30d
- Under 100K
- Medium+ evidence
- Claimed creators

### Full filter drawer

- Platform
- Creator category
- Audience scale
- Market instrument
- Trading eligibility
- Proof of Attention band
- Evidence confidence
- Data freshness
- Risk level

### Sort

- Attention movement
- Platform-native rank
- Trending now
- Most watched
- Most backed
- Highest evidence
- Newest work
- Ending soon
- Lowest risk

Sort semantics must state whether the ordering is provider-supplied or Backer-supplied.

### Share

Share copies a URL that restores:

- active view
- platforms
- signal window
- quick filters
- full filters
- sort
- selected creator
- selected instrument

## Left pane: people gaining attention

Each row shows:

- real profile image
- real display name and handle
- creator field or content category
- active platform marks
- one-line `Why now`
- evidence freshness
- platform-native rank or policy-safe attention label
- Watch state

The row does not lead with a contract title.

### Selection behavior

Selecting a person updates in one state transaction:

- center dossier
- recent work
- breakout work
- Proof of Attention
- right-side trade ticket
- intelligence rail context
- URL state
- mobile ticket

Keyboard and touch selection must be supported.

## Center pane: creator world

### Identity header

- real portrait
- name and handle
- one-sentence creator description
- platform profile links
- claim status
- market eligibility
- Watch
- Compare
- Trade

`Watch` is visually available before `Trade`.

### Why attention is moving

A concise explanation tied to observable work and sources. It must not sound like generic AI commentary.

### Latest work

Shows the newest retained content item from the selected platform or all active platforms.

Required fields:

- platform
- title or platform excerpt
- content type
- published timestamp
- official content URL
- source-provided thumbnail or same-origin cached profile image
- raw provider metrics when policy permits
- observed timestamp

### Breakout work

Shows the work most responsible for attention movement inside the selected window.

The interface must distinguish:

- provider-supplied popularity or ordering
- raw observed metrics
- Backer interpretation

The work is evidence around the person. It is never silently treated as the market itself.

### Proof of Attention interface

The summary must expose:

- source platform
- source link
- creator and content identity
- observation window
- observed timestamp
- refreshed timestamp
- raw metric name and value
- provider rank when available
- evidence freshness
- evidence confidence
- coverage gaps
- claim and consent status
- Backer interpretation
- methodology version

The panel explicitly separates:

1. Public or creator-authorized evidence.
2. Backer underwriting interpretation.
3. Executable market price.
4. Contract settlement source.

Proof of Attention never settles a contract unless the written contract explicitly names an independent permitted source.

## Right pane: trade and intelligence

### Trade ticket

The ticket begins with the selected person, not the market question.

Default plain-language structure:

- `What do you think happens next?`
- instrument tabs
- selected outcome or direction
- start with `$10`
- stake input
- maximum loss
- possible return or payout rule
- position close or continuous funding cadence
- `Preview position`
- `Open full terminal`

Advanced disclosure reveals:

- last trade
- bid
- ask
- spread
- normalized probability when applicable
- liquidity or simulated volume
- order type
- funding for perps

### Screenshot 2 modules

The right pane retains these modules below the ticket:

1. Your market
2. Backer AI Pulse
3. Trending
4. Top movers
5. Risk watch
6. More

Each row is a person-first link that can update the selected dossier.

### Your market

- watched people
- open positions
- simulated or real designation
- total stake
- portfolio link

### Backer AI Pulse

Plain-language market observations only. Every line includes its basis:

- ranking snapshot
- evidence grade
- provider status
- market status

### Trending and movers

Names are real people. Values must be sourced, policy-safe, or explicitly labeled sample data.

### Risk watch

Shows:

- stale provider data
- weak evidence
- concentrated attention
- market pause
- eligibility review

## Market instruments

### Milestones

Binary or fixed-term market tied to a written measurable creator milestone.

Required display:

- target
- current observed value
- deadline
- resolution source
- payout terms
- progress separate from probability

### PK Market

Multi-outcome market around content, creator matchups, or mutually exclusive outcomes.

Required display:

- all outcomes
- normalized versus executable prices
- deadline
- settlement source
- liquidity and spread

### Creator Arena

Creator Arena is the approachable competitive discovery surface. It may use PK Market as its executable market layer, but it has its own people-first presentation.

Required behavior:

- choose or compare two creators
- show each person's recent and breakout work
- show comparable Proof of Attention coverage
- show the exact arena question
- make competition feel playful and informed, not dehumanizing
- route the actual position into the PK instrument in the full terminal

### Creator Perps

Continuous long or short exposure to an approved creator attention index.

Required display:

- index and mark separated
- long and short
- margin
- funding cadence
- liquidation or maximum loss explanation
- no fake expiry

## Eligibility and human safeguards

Every discovered person starts as `discovery_only`.

Trading requires:

1. Identity link confidence.
2. Creator claim or documented consent.
3. Platform-account verification.
4. Right-of-publicity and market policy review.
5. Instrument-specific eligibility approval.
6. Written settlement source.

Public GitHub developers, unclaimed social profiles, and editorial discovery candidates remain research and Watch only.

The UI must not imply endorsement by a creator.

## Data architecture

### Flow

`Official adapters -> raw observations -> normalized identities -> dated snapshots -> policy-aware evidence compiler -> marketplace read model`

### Core tables

#### `market2_people`

- immutable person ID
- slug
- display name
- public description
- same-origin portrait asset
- category
- claim status
- discovery status
- created and updated timestamps

#### `market2_source_accounts`

- person ID
- platform
- native account ID
- handle
- profile URL
- account type
- verification state
- latest refresh
- source policy mode

#### `market2_content_items`

- immutable content ID
- person ID
- source account ID
- platform
- native content ID
- canonical URL
- title or excerpt
- content type
- published timestamp
- thumbnail reference when permitted
- current availability

#### `market2_metric_snapshots`

- subject type and ID
- platform
- metric name
- raw metric value
- observation window
- observed timestamp
- source timestamp
- provider rank
- raw provider payload reference

#### `market2_attention_evidence`

- person ID
- window
- platform coverage
- evidence facts
- coverage gaps
- interpretation text
- confidence grade
- methodology version
- generated timestamp

#### `market2_market_eligibility`

- person ID
- instrument
- status
- consent record
- policy review
- settlement source
- reviewed timestamp

#### `market2_sync_runs`

- provider
- started and completed timestamps
- status
- item counts
- rate-limit metadata
- error summary
- last-good snapshot reference

#### `market2_deletion_tombstones`

- provider
- native object ID
- removal reason
- requested timestamp
- completed timestamp

## Platform connector requirements

### X connector

Official path:

- `GET /2/trends/by/woeid/{woeid}` for topics.
- `GET /2/tweets/search/recent` for posts from the last seven days.
- `GET /2/tweets/counts/recent` for topic-volume curves.
- author and media expansions for real creator and work records.
- `GET /2/users/{id}/tweets` for a claimed creator's recent work.

Constraints:

- There is no direct trending-people response.
- Candidate authors inferred from trends remain discovery-only.
- Production requires an approved app, bearer token, paid usage, compliant display, deletion rehydration, and explicit disclosure of Backer's commercial market use case.
- Backer must not use X data for surprising off-platform identity matching, sensitive inference, or surveillance-style profiling.

### YouTube connector

Official path:

- `videos.list(chart=mostPopular)` for YouTube-provided popularity ordering.
- `search.list` for topic and channel discovery.
- `channels.list` for channel metadata and uploads playlist IDs.
- `playlistItems.list` for recent uploads.
- `videos.list` for raw public video metadata and statistics.

Constraints:

- Since July 2025, `mostPopular` is not a general creator trending feed. It focuses on Trending Music, Movies, and Gaming.
- Public data must be refreshed or removed within YouTube's required retention window.
- Do not cache audiovisual content.
- Before a successful YouTube audit and derived-metrics amendment, Backer must not combine YouTube API data with other platform data into a custom creator score, creator leaderboard, or rivalry metric.
- Pre-approval UI uses YouTube-provided ordering and raw labeled YouTube metrics only.

### Instagram connector

Official path:

- Instagram Platform APIs with OAuth and App Review.
- claimed Professional account media and insights.
- known Professional-account Business Discovery when permitted.
- small approved hashtag seeds where supported.

Constraints:

- Consumer accounts are not available through the official professional API path.
- Business Discovery is a lookup for known usernames, not a global people search.
- There is no official global trending-people endpoint.
- No automated scraping or OCR without separate written permission.
- Discovery combines opted-in creators, editorial seeds, approved hashtag discovery, and known Professional accounts.

### GitHub connector

Official path:

- REST user and repository search.
- user and repository lookup.
- aggregate repository statistics.
- GraphQL `ContributionsCollection` for dated contribution totals.

Constraints:

- GitHub does not document a Trending API.
- Do not production-scrape Trending pages or `since=` URLs.
- Use aggregate star snapshots, not individual stargazer identities or timestamps.
- Exclude public email and location.
- Support removal and opt-out.

### Official technical references

- https://docs.x.com/x-api/overview
- https://docs.x.com/x-api/trends/get-trends-by-woeid
- https://docs.x.com/x-api/posts/search/introduction
- https://docs.x.com/developer-terms/policy
- https://developers.google.com/youtube/v3/docs
- https://developers.google.com/youtube/v3/docs/videos/list
- https://developers.google.com/youtube/v3/docs/search/list
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/derived-metrics-policy
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- https://www.facebook.com/legal/automated_data_collection_terms
- https://docs.github.com/en/graphql/reference/users
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies

## API contract

### Read endpoint

`GET /api/market2/people?platform=x,youtube,instagram,github&window=7d&view=markets&sort=movement`

Response:

```json
{
  "generatedAt": "2026-08-11T00:00:00Z",
  "status": "live",
  "isFixture": false,
  "window": "7d",
  "platforms": ["x", "youtube", "instagram", "github"],
  "providerStatus": {},
  "people": [],
  "rightRail": {},
  "methodology": {},
  "nextCursor": null
}
```

### Static fallback

GitHub Pages and provider outages read:

`data/market2-people.json`

The fallback must retain:

- real public people
- real public content links
- source timestamps
- provider status
- policy mode
- `isFixture` or `isSnapshot` disclosure

It must not present stale data as live.

## Date and coverage semantics

- `24H`, `7D`, `30D`, and `90D` are observation windows.
- A platform is included only if actual retained coverage supports the window.
- X recent search must not be presented as 30-day or 90-day coverage.
- YouTube provider rank remains provider rank.
- Contract close and resolution dates remain independent.
- Every metric shows an observed or refreshed timestamp.

Recommended sync cadence:

- X: every 15-30 minutes within quota and approved use.
- YouTube: every 1-6 hours.
- Instagram: every 1-6 hours.
- GitHub: every 6 hours.

## Data states

Every provider and the overall marketplace support:

- loading
- live
- delayed
- refresh failed with last-good snapshot
- empty window
- partial coverage
- permission required
- rate limited
- removed content
- discovery-only
- eligible

Loading uses shape-matched skeletons. Errors stay contextual and do not erase valid cached data.

## Content and media handling

- Use real public profile images and real work thumbnails only.
- No AI-generated portraits or content art.
- Prefer same-origin cached portrait assets with source and capture metadata.
- Do not cache YouTube audiovisual content.
- YouTube thumbnails may be displayed only as permitted by the API and current policy.
- External media hosts require an allowlisted proxy or CSP update.
- Removed or unavailable content receives a tombstone state, not a broken image.

## Interaction rules

- All interactive controls are at least 44px on touch layouts.
- Focus follows creator selection on mobile only when requested by the user action.
- Filters update without losing the selected person if the person still matches.
- If the selected person no longer matches, select the first eligible row and announce the change.
- Watch state persists locally and is ready for account sync.
- Trade preview never submits a position without explicit confirmation.
- The full terminal is the authoritative execution surface.
- Reduced motion removes automatic entry movement.

## Accessibility

- Semantic buttons and links.
- Listbox or list semantics for person selection.
- Visible focus ring using Backer amber.
- Screen-reader announcement for filter result count and selected person changes.
- Real alt text uses the person's name and source context.
- Charts include readable summaries and data tables or text equivalents.
- Color is never the only status signal.
- Contrast meets WCAG AA.

## Analytics

New events:

- `market2_viewed`
- `market2_platform_filtered`
- `market2_window_changed`
- `market2_person_selected`
- `market2_work_opened`
- `market2_poa_opened`
- `market2_watch_toggled`
- `market2_instrument_changed`
- `market2_position_previewed`
- `market2_terminal_opened`
- `market2_share_copied`
- `market2_provider_state_seen`

No sensitive creator data or raw provider payload is placed in analytics properties.

## Implementation boundary

### New files

- `css/market2.css`
- `js/market2-data.js`
- `js/market2.js`
- `data/market2-people.json`
- `api/_lib/market2-repository.js`
- `api/market2/people.js`
- `scripts/sync-market2-people.mjs`
- `migrations/003_market2_people.sql`
- `tests/core-market2.test.js`

### Modified files

- `backerdemo.html`
- `js/app.js`
- `js/analytics-core.js`
- `js/market-detail-page.js`
- `package.json`
- `vercel.json` only when required for the chosen refresh route or trusted media source

### Router requirements

- Match `#market2` before `#market`.
- Narrow the old matcher to `^#market(?:\\?|$)`.
- Add `window.BackerMarket2.render(app)`.
- Apply full-width market styling to both routes.
- Keep the Market dock selected for both routes.
- Primary marketplace CTAs open Market 2.
- A Market 2 terminal deep link uses `source=market2`.
- The terminal back link returns to `backerdemo.html#market2` when that source is present.

## Acceptance criteria

### Product

- `backerdemo.html#market2` opens the new marketplace directly.
- `backerdemo.html#market` still opens the existing marketplace.
- X, YouTube, Instagram, and GitHub filters all return real public people and real linked work in the launch snapshot.
- Time filters change only to windows supported by retained evidence.
- Person selection updates all three panes and URL state.
- Recent work and breakout work are visible before deep market mechanics.
- Proof of Attention clearly separates evidence, interpretation, price, and settlement.
- Watch works without trading.
- Discovery-only people cannot open a trade.
- Eligible people can open Milestones, PK Market, Creator Arena, and Creator Perps.
- Full terminal links carry creator, instrument, and `source=market2`.
- Screenshot 1 control families are retained.
- Screenshot 2 rail modules are retained.

### Visual

- Real portraits load with stable fallback behavior.
- No AI imagery appears.
- Backer palette and logo remain intact.
- No generic equal three-card grid is used as the primary marketplace.
- The right rail never becomes a cramped fourth column.
- Long text does not wrap primary CTAs on desktop.
- No horizontal overflow at 320, 390, 768, 1024, 1440, and 1920px.
- The page remains legible at browser zoom levels used in Backer review.

### Data and policy

- Browser code contains no provider secrets.
- Missing provider credentials produce a labeled last-good or permission-required state.
- Provider timestamps and source URLs are visible.
- YouTube data is not used in an unapproved cross-platform score.
- Instagram discovery does not scrape consumer pages.
- GitHub ingestion uses official APIs.
- Removal and opt-out are represented in the schema.

### Quality

- Existing lint passes.
- Existing test suite passes.
- New data contract tests pass.
- JavaScript syntax checks pass.
- Desktop and mobile console contain no Market 2 errors.
- Every filter, person row, work link, PoA action, Watch action, instrument tab, and terminal link is exercised.
- Current `#market`, Portfolio, search, and home routes still work.

## Release plan

1. Write and approve this PRD.
2. Implement the isolated Market 2 namespace.
3. Add the policy-aware snapshot and API contract.
4. Populate the launch snapshot with real public profiles and work.
5. Validate source and interaction states locally.
6. Validate old routes for regressions.
7. Commit only Market 2 scope.
8. Reconcile with the latest remote `main` without overwriting unrelated work.
9. Push and verify the Pages build.
10. Verify the live `backerdemo.html#market2` route in the browser.

<design_plan>
seed = 20260811
random.choice -> hero architecture: Editorial Split command header
random.choice -> font: Geist; components: Conviction tri-pane, evidence filmstrip, stacked intelligence rail; motion: selection crossfade, evidence stagger

AIDA adaptation: Backer's product route does not use a marketing-page AIDA sequence. Attention is the person roster, Interest is the creator world, Desire is Proof of Attention plus work, and Action is Watch or Trade.

Hero math: Market 2 uses a compact command header rather than a landing-page hero. The title is limited to one line at desktop and two lines below 768px. No stamp icons or decorative tag spam.

Workspace math: desktop grid is `minmax(250px, 3fr) minmax(520px, 7fr) minmax(300px, 3.5fr)`. The right-side intelligence modules stack inside the trade column. There is no empty grid cell and no fourth column.

Label and contrast sweep: no numbered section labels, no generic meta labels, no duplicated primary CTA intent, and all Backer amber or warm-white buttons meet contrast requirements.

Motion: no GSAP dependency is added to this dense static application. Motion intensity is intentionally 4. Selection crossfades, sticky transitions, and evidence reveals use transform and opacity, honor reduced motion, and communicate state change rather than decoration.
</design_plan>
