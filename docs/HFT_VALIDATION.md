# HFT Research use case: validation record

23 September 2026. Built locally in `agent/research-hft-20260923`, based on fetched `origin/main` at `50da9a6`. Initial delivery was local. The user subsequently authorized refinement and launch; the release candidate below is ready for publication.

## Deliverable

- Packaged preview: http://127.0.0.1:4398/use-cases/high-frequency-trading.html
- Research entry: http://127.0.0.1:4398/research.html
- Source: `use-cases/high-frequency-trading.html`, `js/hft-model.js`, `js/hft-research.js`, `css/hft-research.css`.
- Locales: `js/locales/hft-research.js` plus the existing shared packs. 461 complete EN→ZH/JA/KO entries; extraction found no missing page-specific static or dynamic strings.
- API invitation and contact route added to all six use cases. Contact leads to the existing early-access form, preserving the selected language. No form was submitted.

## Research and evidence boundaries

Read `HFT_PAPER_AUDIT.md` for the original-paper review, including the corrected interpretation of relative alpha, sample coverage, correlation limitations and claim-by-claim blurb audit. The original 80-page NBER PDF was retrieved and key tables inspected.

Read `HFT_JEV_AUDIT.md` for the architecture and current documentation audit. `hft-jev-interface-check.py` passed against TypeSafe SDK 0.7.1 with mocked HTTP; `hft-jev-interface-check-output.json` records that result. This checks request/response compatibility, not real inference, accuracy, latency or profitability.

The Medium URL was inaccessible during the initial pass. On 24 September the user supplied the complete article text, which was read and audited against current TypeSafe docs and SDK 0.7.1. The page now incorporates its setup, state, parallel judgment, policy, update and calibration sequence directly in the Jev section. See HFT_JEV_AUDIT.md for concrete corrections to the supplied examples and claims.

All response distributions on the page are authored teaching fixtures. No trader corpus, trained simulation, live Jev request, broker connection, order execution, or new API service is included. The opening-API copy describes early access. The proposed alpha remains a research hypothesis.

## Verification

- Full repository test command: `node --test tests/core*.test.js tests/backend*.test.js tests/market2-v21-release.test.js` — **293 passed, 0 failed**.
- Repository lint passed; final locale syntax and `git diff --check` passed.
- Public build: **223 allowlisted files, 0 critical exposure findings**. The two HFT scripts have reviewed byte digests; unknown or modified HFT scripts fail the research boundary policy. Internal audits, SDK test files and screenshots are excluded from the public artifact.
- Browser: all nine event/history combinations updated the four probabilities and conserved 100%; history removal restored the common event-only reference; reset restored the initial case. Keyboard activation was checked.
- Both empirical benchmarks updated exact source estimates and approximate intervals. All four architecture stages updated the visible explanation. Expired context was rejected; the clock origin and retry rule are stated.
- Packaged Research → HFT → contact navigation tested in Chinese, with same-host paths and language retained. The email field was visible; no submission occurred.
- Desktop 1280px and mobile 390px verified for EN/ZH/JA/KO. Extra 320px checks passed. Viewport widths were explicitly measured; no horizontal page overflow. Final screenshots are in `docs/review/hft/`.
- Reduced-motion emulation produced `scroll-behavior: auto` and zero-duration control transitions. Temporary emulation was cleared.
- Reviewed the actual hero, chart, response controls, architecture and API layouts. Charcoal/gold identity, readable mobile labels and aligned columns retained. No remaining blocking visual defect observed.

## Reproduce the build

The public builder requires an empty destination. Use a fresh output directory:

```sh
node scripts/build-pages-artifact.mjs /tmp/backer-hft-review-artifact
python3 -m http.server 4398 --bind 127.0.0.1 --directory /tmp/backer-hft-review-artifact
```

This checkout borrowed the existing repository dependencies during verification. Dependencies and build configuration were not changed.

## Refinement verification

- Hero states the behavioral-edge thesis directly and highlights EDGE (or its localized equivalent) in yellow. The investor field responds to event and profile selections.
- Added population-weighted alluvial flow, three population compositions, direct cohort tracing, a headcount imbalance readout and a numerical table. All 18 event/composition/history combinations conserve 100 expected choices. Removing history makes aggregate outcomes invariant to composition.
- Added a visual freshness clock with three selectable ages. Expired context is discarded at the original deadline.
- Four-language browser checks verified the new figures, native copy, focused cohort retention after redraw, common baseline on history removal, expiry states and locale-preserving contact links. The user’s 645px view and narrow 390px layout were inspected.
- The revised scripts contain only cited research data, authored fixtures, deterministic presentation arithmetic and UI behavior; no network calls or private data. Updated reviewed hashes match the audited minified artifact.

## Individual-trader correction and re-release

The user clarified that the core edge is accumulated individual trading behavior and that Jev belongs in the simulated trader's next-decision loop. The page now leads with that mechanism and places the empirical motivation after the trader simulation.

- Added three fictional individual trading histories with inspectable records and current conditions, rather than relying only on generic cohort labels.
- Added a Jev decision-loop explanation and interactive authored-choice demonstration: select a trader and situation, advance three steps, observe holdings and cash, reset and compare. Jev is explicitly a bounded next-choice primitive; the public page does not call a live model.
- Added seven ledger/fixture tests. Fourteen HFT model tests and all 293 repository tests pass. Tests cover exact buy/sell/hold accounting, feasibility limits, input immutability, invalid ledgers and preservation of observed-history records.
- Rewrote the full Chinese page as native editorial copy; updated Japanese and Korean. All 280 active source strings have three translations; the catalog has 344 entries including compatibility keys.
- Reviewed the actual Chinese hero, individual record inspector and decision ledger. Source and packaged preview show the revised accumulated-history thesis and why Jev participates in simulation.
- Added HFT_JEV_DECISION_LOOP.md with the exact documented Choice request and separation of observed history, simulated state, model abstention and real outcomes.


## Supplied article integration and four-language editorial pass — 24 September

The supplied complete guide is now embedded as an original six-step implementation walkthrough inside the Jev section, with adjacent attribution and source link. It covers SDK setup, timestamped individual state, independent Choice/Noul/Score questions, deterministic policy, sequential simulation updates and held-out calibration. A collapsible 36-line Python request uses current SDK syntax. The contextual contact invitation sits immediately after the guide; all six use cases retain the API/contact footer.

- Rewrote the English narrative and reviewed every active language: 117 new translated keys, with further native editorial changes in Chinese, Japanese and Korean. 461 three-language entries; all 337 active display strings covered.
- Browser checked all six stages, all three primitive displays and all five policy conditions in EN/ZH/JA/KO at measured 390px, with no page overflow. Desktop English and mobile Chinese/Japanese/Korean render checks completed. Keyboard Enter switches the primitive, next-step wraps correctly, code expands without page overflow, and the contextual contact link preserves language and reaches the existing email form.
- Current SDK 0.7.1 examples were validated with mocked transport. The reference two-step script and result are saved in hft-guide-sdk-example.py and hft-guide-sdk-check-output.json. No live Jev call or order was sent.
- Repository tests: 293 passed. Lint and syntax passed. Final public artifact: 223 allowlisted files, zero critical exposure findings. The reviewed UI digest is the esbuild-minified output digest, matching the publication artifact; source and output were inspected as authored UI data only.
- SDK code, article audit, tests and review screenshots remain outside the public artifact.

## Hero mechanism redesign — 24 September

Replaced the anonymous cohort field with a named trader's inspectable history, a Jev decision boundary and three selectable next actions. Readers can change the market event, withhold history, inspect each prior trade and trace an action into the next account state. The fixed initial account makes the contribution of history directly comparable; later real observations extend observed history separately from simulated choices.

- Added three-action authored teaching fixtures, signed historical share changes and fixed-lot account projections. Five new tests cover probability conservation, baseline invariance, fixture isolation, exact accounting and invalid input handling. All 19 HFT tests and all 298 repository tests pass; lint and diff checks pass.
- Browser checked all nine trader/event combinations, history removal across all individuals, all three selectable action projections, Enter-key operation and retained focus. Shared history and reset controls synchronize the hero with the lower simulation.
- Visually inspected the desktop composition at 1440px, the user's 645px review width and 390px mobile layout. Reviewed EN/ZH/JA/KO, including history-withheld rendering. No horizontal page overflow. The figure stacks below the headline at 1100px to preserve readable interactive controls instead of shrinking the chart.
- Nineteen new source strings are localized; 348 active source strings have all three CJK translations. Authored-fixture attribution stays visible. The supplied guide, plain-text paper citation and beta API/contact copy remain intact.
- The minified artifact was browser checked at 645px; its history toggle produces the same zero-difference baseline. Public build audits 223 allowlisted files with zero critical findings. Both reviewed script hashes were recomputed from inspected esbuild output. No live inference requests or trading execution were introduced.
