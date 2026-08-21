# Backer Trades — Real Subjects, Paper Markets

Status: implementation contract

Host: GitHub Pages

## 1. Product decision

Discovery and Trades are two interfaces over the **same retained public catalog**.

| Surface | Route | Job |
| --- | --- | --- |
| Discovery | `backerdemo.html#market2` | Research real people and original work |
| Trades | `backerdemo.html#trades` | Express and track a simulated financial view on their future growth |

Public Trades contains **zero fixture people and zero fixture content**. `js/market-data.js` may remain only for archive compatibility and automated tests; `#trades` must not load, render, rank, or link to it. Trades may derive paper-market state from catalog IDs, but it is not a second subject database.

The person, work, source, and observed metrics are real. Quotes, movement, volume, orders, and positions are deterministic simulations. The main surface uses one compact `Paper market · modeled activity` status; the full no-external-money boundary appears in the ticket confirmation and receipt, not as repetitive copy on the page or cards.

## 2. Public information architecture

Trades reuses the prior market-board density and hierarchy with real retained subjects:

1. **For you** — an explainable device-ranked mix of eligible profiles and work.
2. **Profiles** — confirmed human creators with source-backed current evidence.
3. **Contents** — exact source-linked work owned by those creators.
4. **Your trades** — saved paper positions with entry, current modeled mark, P/L, contract, and receipt IDs.
5. **Proposals** — device-local custom bet drafts, kept separate from modeled paper markets.

`#trades` opens For you. Canonical states:

- `#trades`
- `#trades?view=profiles`
- `#trades?view=contents`
- `#trades?view=positions`
- `#trades?view=proposals&proposal=<draftId>`

There is no separate trade-history panel in this static release: current paper positions retain their receipt identifiers, while settlement and closed-position history require the later settlement service.

The shared floating dock remains consistent on all public pages.

## 3. One catalog and identity graph

Source of truth: `data/discovery-catalog.json`, accessed through `js/discovery-catalog-client.js`.

Trades preserves exact creator, identity, content, metric-observation, canonical/source URL, and timestamp fields. A derived paper market is keyed by `subjectType + subjectId + metricObservationId + modelVersion`; it never copies or renames a subject.

A profile enters Trades only when the same catalog record has:

- reviewed `entityKind: human` and `identityReview: confirmed`;
- display name, source-proven portrait, and at least one source identity;
- a numeric provider-native observation with value, unit, source URL, and observation time.

Organizations, brands, bots, anonymous handles, uncertain matches, and fallback-logo portraits remain discoverable but do not enter Trades.

A work enters Trades only with an exact content ID, eligible owner, provider/type, title, canonical URL, time, real thumbnail, and numeric source observation. Ownership must resolve through `creatorId` and `platformIdentityId`. Missing-thumbnail work may remain searchable in Discovery but cannot occupy the initial Trades grid.

## 4. Agent Reach acquisition

Agent Reach is the acquisition router; Backer does not invent platform scrapers.

- Run `agent-reach doctor --json` before each multi-platform job and use the documented active backend.
- Follow each platform reference retry chain and require substantive profile/content output, not a zero-error exit.
- Instagram uses OpenCLI with the user’s existing Chrome session: user search → profile → recent posts. Static GitHub Pages never accesses that session.
- Use prescribed upstream tools for YouTube, Bilibili, GitHub, LinkedIn, RSS/web, and supported social platforms. For an uncovered source, inspect `opencli list`; publish nothing until a real read adapter succeeds.
- Keep credentials/raw output in `~/.agent-reach/` and `/tmp/`; publish normalized public fields and provenance only.
- Record backend, method, time, result count, and truthful failure reason in `providerRuns`. Provider failures remain internal; public feeds omit ineligible records.

“Supported” means a target returned non-empty data in that run. Doctor configuration alone is not proof. No fabricated subject, metric, portrait, thumbnail, or success state is allowed.

## 5. Paper-market model

For each eligible profile/work, generate a reproducible standard growth contract from its exact retained observation:

- baseline: retained numeric value and time;
- target/cutoff: deterministic scenario rule with named `modelVersion`;
- outcomes: `Back` (target reached) and `Fade` (target not reached);
- quote: 5–95¢ deterministic paper price using the subject/observation/model key, current time bucket, and retained native delta when present;
- movement: current paper quote minus the previous time bucket;
- volume: deterministic paper liquidity/activity, never represented as human or cash activity;
- resolution: the same provider-native metric after cutoff; missing/corrected/deleted source follows explicit void rules.

The engine must replay identically for the same inputs and UTC bucket. It may not claim predictive accuracy. A catalog refresh may update evidence; it may not rewrite an executed paper receipt.

## 6. Card and ticket contract

Profile card: real portrait, name/handle/provider, full growth claim, Back/Fade quote, movement, paper volume, current native metric/time, Watch, Research, and Back/Fade actions.

Content card: real thumbnail, exact title/creator/provider/type, full claim, quote/movement/paper volume, source metric/time, Watch, Research, and Back/Fade actions.

Clicking a side opens a ticket with subject, outcome, quote, paper cash, quantity, estimated cost, max loss, simulated payout, cutoff, resolution source/rules, and confirm. Confirm writes only a device-local paper order/position and receipt.

Typography keeps Backer’s visual language but follows the already accepted Kalshi/Polymarket legibility standard for size, weight, contrast, line height, and numeric alignment. Grids are three/two/one columns without truncating claims, units, dates, or actions.

## 7. Custom bet flow

`Build a custom bet` opens the existing composer with the exact subject locked:

1. subject;
2. provider-native metric and retained baseline;
3. target and cutoff;
4. source/correction/deletion/void rules;
5. review and start paper market.

The composer re-reads the catalog and fails closed on any ID, ownership, or observation mismatch. A saved item remains `local_draft / discovery_proposal / simulation`; starting it creates only a device-local paper contract and optional position. Approval, real quote, fee, stake, custody, and execution stay null.

## 8. Discovery ↔ Trades linking

- Discovery cards deep-link to the exact Trades subject; Trades links back through `Research this subject`.
- Watch, recent-open, proposal, and position state use shared device keys.
- A work link preserves both `creatorId` and `contentId`.
- Missing IDs never fall back to another record.
- A paper trade never changes the catalog record or its `tradable=false` public status.

## 9. Personalization

Ranking uses explicit device-local actions only: watches, paper positions, proposals, recent opens, provider filters, categories, and content types. Priority: exact subject → same creator/work → provider/type/category affinity → evidence freshness → deterministic source rank/ID.

The feed says `For you · on this device` and gives a short reason (`Because you watched this creator`). Reset restores deterministic catalog order. No server identity, inferred demographics, hidden score, or cross-device claim.

## 10. Build sequence

1. Remove fixture loading/rendering from public `#trades`; retain archive/test access only.
2. Add reviewed-human and Trades-eligibility fields to the existing catalog schema/validator.
3. Run Agent Reach ingestion; normalize, deduplicate, and attach source/asset/metric provenance.
4. Extend the catalog client with exact eligible profile/content/observation selectors.
5. Build the deterministic paper quote, movement, volume, contract, and replay engine.
6. Replace Trades routes/tabs with For you, Profiles, Contents, Your trades, and Proposals.
7. Build real profile and content market cards with three/two/one responsive grids.
8. Build Back/Fade ticket, paper balance, position, receipt, and portfolio state.
9. Reuse the composer/store for exact-subject custom paper markets.
10. Wire bidirectional Discovery links and shared watch/recent state.
11. Rank both feeds from device signals with reasons and reset.
12. Pass unit, browser, accessibility, responsive, live-byte, and rollback gates before Pages release.

## 11. Release acceptance

1. Network/DOM audit proves `#trades` does not request `market-data.js` and contains no fixture ID, person, work, portrait, claim, or activity value.
2. Sampled profile/content cards are exact catalog records; identity, owner, image, metric, source, and time match retained data.
3. The same paper-market inputs replay the same quote/volume/movement; changing the documented time bucket changes only derived simulation fields.
4. The compact page status, ticket confirmation, and receipt disclose simulation; cards remain concise.
5. Discovery → Trades → ticket/composer → Your trades preserves exact IDs across reload, edit, close, and history.
6. Confirming an order changes only paper balance/position storage, makes no financial/network request, and cannot exceed paper cash or configured loss.
7. Agent Reach run evidence is complete; a blocked channel publishes no new records.
8. Personalization is deterministic, explainable, resettable, and device-local.
9. Full names, claims, units, dates, quotes, and actions remain readable at 320, 390, 608, 900, and 1440 px in dark/light themes.
10. Automated tests, rendered visual review, GitHub Pages parity, live routes, and rollback verification pass.

## 12. Out of scope

Real money, custody, deposits, withdrawals, wallets, order books, settlement service, client-side market approval, server personalization, cross-device sync, and invented provider coverage.
