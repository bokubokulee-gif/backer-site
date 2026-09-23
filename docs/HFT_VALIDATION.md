# HFT Research use case: validation record

23 September 2026. Built locally in `agent/research-hft-20260923`, based on fetched `origin/main` at `50da9a6`. Initial delivery was local. The user subsequently authorized refinement and launch; the release candidate below is ready for publication.

## Deliverable

- Packaged preview: http://127.0.0.1:4398/use-cases/high-frequency-trading.html
- Research entry: http://127.0.0.1:4398/research.html
- Source: `use-cases/high-frequency-trading.html`, `js/hft-model.js`, `js/hft-research.js`, `css/hft-research.css`.
- Locales: `js/locales/hft-research.js` plus the existing shared packs. 201 complete EN→ZH/JA/KO entries; extraction found no missing page-specific static or dynamic strings.
- API invitation and contact route added to all six use cases. Contact leads to the existing early-access form, preserving the selected language. No form was submitted.

## Research and evidence boundaries

Read `HFT_PAPER_AUDIT.md` for the original-paper review, including the corrected interpretation of relative alpha, sample coverage, correlation limitations and claim-by-claim blurb audit. The original 80-page NBER PDF was retrieved and key tables inspected.

Read `HFT_JEV_AUDIT.md` for the architecture and current documentation audit. `hft-jev-interface-check.py` passed against TypeSafe SDK 0.7.1 with mocked HTTP; `hft-jev-interface-check-output.json` records that result. This checks request/response compatibility, not real inference, accuracy, latency or profitability.

The requested Medium tutorial could not be read through web retrieval, the documented reader, direct HTTP or browser content extraction. The browser eventually exposed its title, but content extraction continued timing out. No unseen tutorial code or return claim is marked verified. The page relies on original research and current TypeSafe primary documentation.

All response distributions on the page are authored teaching fixtures. No trader corpus, trained simulation, live Jev request, broker connection, order execution, or new API service is included. The opening-API copy describes early access. The proposed alpha remains a research hypothesis.

## Verification

- Full repository test command: `node --test tests/core*.test.js tests/backend*.test.js tests/market2-v21-release.test.js` — **286 passed, 0 failed**.
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
