# Backer Trades — Scale Release Contract

Status: implementation contract

Host: GitHub Pages

Inventory floor: **1,000 profile markets and 1,000 work markets**

## 1. Product decision

Discovery and Trades are two interfaces over the same retained public catalog.

| Surface | Route | Job |
| --- | --- | --- |
| Discovery | `backerdemo.html#market2` | Research public creator accounts and original work |
| Trades | `backerdemo.html#trades` | Back or fade measurable future growth through paper markets |

Trades is people-centric: a profile or an exact work is always the subject; the growth milestone is its contract. The subject, retained source-account linkage, media, native observation, source, and observation time are retained public facts. Quotes, movement, volume, orders, and positions are deterministic paper simulations.

Public Trades must never load or substitute fixtures from `js/market-data.js`. One compact `Paper market · modeled quotes` status is enough on the main surface; ticket and receipt carry the complete simulation boundary.

The pre-Trades fixture marketplace remains available at `backerdemo.html#market-archive` as an isolated historical demo. It loads independent archive assets and never contributes subjects, quotes, positions, search results, or portfolio records to Trades.

## 2. Public information architecture

1. **For you** — device-ranked profiles and work with a short reason.
2. **Profiles** — at least 1,000 eligible public creator-account growth markets.
3. **Contents** — at least 1,000 exact original-work growth markets.
4. **Your trades** — paper positions, current modeled mark, P/L, and receipt IDs.
5. **Proposals** — device-local custom contract drafts, separate from modeled markets.

Canonical routes are `#trades`, `#trades?view=profiles`, `#trades?view=contents`, `#trades?view=positions`, and `#trades?view=proposals&proposal=<id>`. The shared floating dock remains consistent across public pages.

## 3. One catalog, two eligible inventories

Source of truth: `data/discovery-catalog.json`, constrained by `data/trades-eligible-accounts.json`, and projected through `js/trades-catalog-model.js`. Trades preserves exact creator, provider identity, work, observation, media provenance, URL, and time fields. A paper market key is `subjectType + subjectId + metricObservationId + modelVersion`.

### Profile market

A profile market is one exact, source-backed **public creator account** that passes the documented account-scope gate. For GitHub, the retained official REST `owner.type` must be `User`; `Organization` and missing types fail closed. This automated eligibility does not establish personhood or legal identity. It requires:

- unique creator ID and unique provider/native identity;
- provider profile URL, display name/handle, portrait, and portrait provenance;
- a numeric provider-native **account/identity observation** with value, unit, source URL, and time;
- a complete deterministic growth contract.

The standard Profile contract must resolve only from an observation whose entity is that exact provider identity. A work observation never qualifies or resolves a Profile market. Accounts without an exact retained account metric remain available in Discovery and custom proposals, but do not enter the standard Profile inventory.

This release admits Profile markets only from validated GitHub `User` and DEV account observations. Provider-classified organizations, organization-shaped records, unresolved identity matches, generic-logo portraits, failed account acquisitions, and every other Profile provider are excluded. Provider `User` types and account-shape screening cannot prove a natural person or reliably eliminate every brand, bot, or pseudonymous account. The UI must call these profile or creator-account markets, never verified humans, government-name matches, or legal-identity reviews.

### Work market

A work market requires a unique content ID, exact retained creator and source-account linkage, matching provider identity, creator portrait provenance, exact title/type, canonical URL, content thumbnail provenance, observed time, numeric content-native observation, and complete contract. The linked creator does not need a Profile market. The metric entity and retained linkage must resolve to that exact work.

The release inventory contains at least **1,000 unique eligible creator-account profiles and 1,000 unique eligible works** after validation and deduplication. Counters report eligible inventory, not total catalog rows. This scale gate is not a claim that 1,000 natural persons were verified.

## 4. Agent Reach acquisition and provider truth

Agent Reach routes acquisition; Backer does not invent platform scrapers.

- Run `agent-reach doctor --json` before a multi-platform job, use the documented active backend, and follow its retry chain.
- A configured command is not support. A provider counts only after a substantive non-empty read whose public fields survive normalization and validation.
- Store backend, method, run time, result count, and failure reason in internal provider-run evidence. Publish normalized public fields and provenance only.
- Keep credentials and raw output outside the project in `~/.agent-reach/` or `/tmp/`.
- Static Pages never reads browser sessions. Blocked providers add no records and do not trigger synthetic fallbacks.
- GitHub and DEV acquisition use their official public APIs when Agent Reach has no active provider backend. GitHub retains exact `followers` for official `User` accounts; DEV retains the exhaustive public `published_posts` listing count. These fields are account-scope, not personhood claims.
- This technical gate does not claim commercial-data, right-of-publicity, or people-market legal clearance. Public launch with DEV account data requires an explicit product/legal decision and a correction/removal path.
- A partial provider run publishes only validated successes. Its checkpoint separates current-attempt candidates/acquisitions/failures from published current/last-good accounts. A first-time failure adds no observation. A later failed refresh may retain a prior validated row only with its original observation time and explicit `last_good` state; it is never counted as a current acquisition or labeled fresh.
- The Profile release gate counts unique validated GitHub + DEV identity observations, including explicitly dated valid last-good rows, and requires at least 1,000. It does not require complete provider coverage.

Provider labels describe the exact source account/work. Cross-platform identities remain separate unless the retained catalog contains a reviewed link.

## 5. Paper-market contract

Each eligible subject gets one reproducible standard growth contract:

- retained baseline value, unit, observation ID, source, and time;
- deterministic target and cutoff with named model version;
- `Back` if the named target is reached; `Fade` otherwise;
- 5–95¢ hourly modeled quote, movement, and paper volume derived only from the subject/observation/model key;
- resolution from the same provider-native metric after cutoff;
  - explicit missing, corrected, deleted, source-linkage-disputed, and metric-definition void rules.

The same inputs and UTC bucket replay identically. Refreshing evidence never rewrites an executed receipt. The model makes no accuracy claim.

## 6. Cards, ticket, and local ledger

Profile cards show portrait, account/provider, full named claim, quote, movement, paper volume, baseline/time, Watch, Research, Back, and Fade. Work cards show thumbnail, exact title/creator/provider/type, the same market numbers, and the same actions.

The ticket shows subject, side, quote, paper cash, quantity, cost, maximum loss, simulated payout/profit, cutoff, exact metric/source, resolution rule, acknowledgement, and confirm. Confirm writes only a device-local position and receipt. It makes no financial request and cannot exceed paper cash.

Three/two/one-column grids preserve full claims, units, dates, and actions. Kalshi/Polymarket are references for human-readable type, contrast, and number treatment only—not Backer’s structure.

## 7. Scale behavior

The catalog may hold thousands of eligible subjects; the DOM may not.

- Initial For you renders at most 12 profile/work cards total; a browse view renders at most 24 subject cards before explicit pagination.
- Search and provider filters evaluate the full eligible inventory, then paginate the result.
- A deep-linked off-page subject is validated and hoisted without rendering preceding pages.
- Sorting and personalization reorder existing eligible IDs; they never remove, duplicate, or fabricate them.
- After catalog load, search/filter feedback targets under 150 ms; the release harness targets first usable Trades content under 3 seconds at 1,000 + 1,000 inventory.

## 8. Discovery links and personalization

Discovery → Trades carries the exact `person` and optional `work` ID. `Research in Discovery` returns those same IDs. Missing or ineligible IDs fail closed; no neighboring record is substituted.

Ranking uses device-local watches, work watches, positions, proposals, recent opens, provider/type affinity, freshness, and deterministic source order. It shows a short reason. Reset removes ranking signals and restores deterministic base order while preserving positions, proposals, receipts, and paper cash.

## 9. Custom contract flow

`Draft custom bet` locks the exact subject, provider metric, retained baseline, and source. The user sets target, cutoff, correction/deletion/void rules, reviews, and saves a device-local proposal. The composer re-reads the catalog and fails closed on any subject, source-account linkage, or observation mismatch. Approval, real quote, fee, stake, custody, and execution remain null.

## 10. Build sequence

1. Measure the retained catalog against the 1,000 + 1,000 evidence gate.
2. Normalize provider identities, retained creator/source-account linkage, media, observations, and provenance.
3. Apply creator-account eligibility, require authoritative provider type where retained, and deduplicate provider/native identities.
4. Exclude fixtures, provider-classified organizations, organization-shaped accounts, ambiguous identities, missing media, and incomplete evidence.
5. Acquire and retain exact account-level observations through an active Agent Reach backend or an explicitly labeled official public-provider fallback.
6. Generate exact profile contracts from identity-native observations only.
7. Generate exact work contracts from work-native observations.
8. Assert unique subject, provider/native identity, observation, and contract keys.
9. Build deterministic quote, chart, movement, and paper-volume state.
10. Render bounded For you, Profiles, and Contents views over full inventory.
11. Wire full-catalog search, provider filter, sorting, pagination, and deep-link hoisting.
12. Wire Back/Fade ticket, paper balance, receipts, positions, and portfolio.
13. Wire custom proposals and exact Discovery round trips.
14. Wire explainable personalization and non-destructive reset.
15. Pass scale, source-integrity, browser, accessibility, responsive, Pages-parity, and rollback gates.

## 11. Release gates

1. Model output has at least 1,000 unique profile IDs, 1,000 unique work IDs, and 2,000 unique contract IDs.
2. No output subject, name, title, source, media, metric, contract, or quote comes from fixture/demo/synthetic data.
3. Every provider/native identity is unique and exact; automated eligibility is labeled account-scope and makes no personhood or legal-identity claim.
4. Every profile has exact account/portrait provenance and its registry-pinned identity-native contract observation; it does not require a Work market. Profile providers are exactly GitHub + DEV. No Profile and Content contract may share an observation ID.
5. Every work independently has exact retained creator/source-account linkage, provider, creator portrait, content media, canonical URL, content-native observation, and contract; its creator does not need a Profile market.
6. Every baseline value/unit/time/source matches its retained observation byte-for-field; simulation fields remain namespaced.
7. Discovery → Trades → ticket/proposal → Discovery preserves exact IDs, including subjects beyond the first rendered page.
8. Search/filter results equal full-catalog predicates; pagination changes rendering only. Personalization is deterministic, explainable, resettable, and cardinality-preserving.
9. Initial DOM stays within its card budget; full inventory counts remain visible and correct.
10. Paper orders are local, replayable, cash-bounded, and make no financial/execution request.
11. Names, claims, units, dates, prices, and actions remain readable at 320, 390, 608, 900, and 1440 px in dark/light themes.
12. Agent Reach run evidence is complete; blocked/empty channels add zero rows.
13. Scale/core/browser/accessibility suites and rendered visual review pass against the exact Pages artifact.
14. Remote `main`, `gh-pages`, public file hashes, live routes, and rollback SHA are verified before release is called live.
15. `#market-archive` still renders the pre-Trades fixture board through isolated assets, while `#market` and `#trades` render the source-backed Trades board.

## 12. Out of scope

Real money, custody, deposits, withdrawals, wallets, external order books, live settlement, legal-identity verification, server personalization, cross-device sync, and invented provider coverage.
