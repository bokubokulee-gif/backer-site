# Simulation V5 acceptance

20 September 2026. Final local artifact: `/tmp/backer-simulation-v5-release`. Browser verification uses an isolated headless Chromium instance; it does not open or control the user's browser.

## Delivered scope

The Research gateway has two expanding menus. The overview and five distinct use cases share top navigation. Six Method/Thesis articles retain their equations and references, with concise, revised explanations. Original preview framing and study descriptions are refined as well.

Typography is larger and heavier. Dark charcoal, ivory, warm gold and restrained orange carry Backer's identity through the pages, controls and scientific figures. Chinese, Japanese and Korean editions cover prose, metadata, chart labels, controls, source/evidence pairs and dynamic results. Language choices propagate through same-host navigation.

The overview now uses 100 persistent illustrative profiles in groups of 40/30/30. Resource parcels preserve a 400-unit budget. Profile count, grouping, geometry, labels and assumptions were updated together. The existing five use-case experiments and fifteen numerical finding fixtures are preserved. New demonstrations remain explicitly synthetic and do not claim trained predictive performance.

## Local verification

- 260 tracked core/backend/release tests pass. Four pre-existing test-fixture failures were reproduced on clean `origin/main` and repaired without changing product behavior; see `SIMULATION_V5_BASELINE_TEST_REVIEW.md`.
- Lint and whitespace checks pass.
- The allowlisted production artifact contains 211 files and passes the exposure audit with zero critical findings. Exact active controller digests are recorded in `SIMULATION_PUBLIC_SCRIPT_REVIEW.md`.
- 16 affected routes × four languages × desktop/mobile = 128 production-artifact browser checks, with no page errors, missing local assets, horizontal overflow or language-loss links.
- Additional 320 px and CJK figure checks cover text bounds, scanner quotes, controls and scientific labels. See `SIMULATION_V5_DESIGN_REVIEW.md`.
- Independent localization checks exercise all use-case controls and fifteen finding inspectors, all three paper figures, overview stages and all four scanner records. See `V5_USECASE_LOCALIZATION.md` and `V5_PAPER_LOCALIZATION.md`.
- Final minified overview checks verify stable profile identities, default outputs of 65 exposed / 51 considering / 31 acting / 62 committed, bounded resource capacity and a conserved 400-unit budget. Mouse, keyboard and touch gestures pass, including 72 CJK scanner evidence assertions.
- Scenario Planning uses a scoped `touch-action: pan-y` rule so horizontal event dragging stays active while native vertical page scrolling remains available.

## Release destinations

Source is published to `main` for Vercel's allowlisted artifact build. The same reviewed artifact is published to `gh-pages`. Completion requires verifying both `https://backer-site.vercel.app/` and `https://bokubokulee-gif.github.io/backer-site/`, including nested routes, language navigation and the deployed controller bytes.

The source commit does not include obsolete console controllers, the abandoned notes-modal script, generated decorative raster images, local dependencies or historical screenshot folders. Existing public research data and its provenance are retained.
