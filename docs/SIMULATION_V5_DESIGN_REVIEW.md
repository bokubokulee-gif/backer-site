# V5 design review

20 September 2026. Local source reviewed on `http://127.0.0.1:4281` with an isolated headless browser.

## Visual system

The simulation overview, five use cases and six research papers now share Backer's dark palette: `#08080a` page background, `#121214` surfaces, `#f5f3ee` warm ivory, `#e9bd86` gold, and restrained `#e77b40` secondary marks. The scanner's source record and output are both dark. Blue highlights and the light editorial sections were removed. Research gateway accents are gold.

Manrope remains the principal face. Display and section headings use weight 600; body copy uses weight 500. Overview/case prose is 18–19 px on desktop and 17 px on mobile; paper prose is 19/17 px. Controls and captions generally use 14–17 px. Diagram labels were increased at their actual rendering scale. Scientific notation, ordinals and compact source metadata use 11–13 px where space is constrained.

The larger scanner source record has 320 px card height on desktop and 397 px on small screens, preserving readable quotes and complete feature values. Figures retain their V4 interaction logic. Selected states, focus rings and signal paths use Backer gold. Four-language controls occupy normal header flow; mobile headers have a dedicated navigation row.

Original trading-preview labels were previously as small as 6–10 px. Semantic labels now use 13 px; explanatory values 15 px. Taller rows and a two-column mobile workflow avoid clipping. The attention preview's body, controls and readouts were enlarged. The externally hosted town application's internals were not edited.

## Verification

- 12 routes × 1440, 390 and 320 px: 36 page/viewport checks, zero page errors and zero document overflow.
- Reviewed rendered overview scene, source scanner, five case scenes and all three paper figures at desktop/mobile widths.
- Mobile choice-distribution axis retains 0%, 50% and 100% labels; intermediate grid lines remain, preventing tick-label collisions.
- Scanner feature labels, source quotes and controls inspected at 320 px.
- Source-script syntax checks and `git diff --check` passed.

Evidence: `/tmp/backer-v5-design/`, with structured `report.json` and screenshots. Review scripts: `/tmp/backer-v5-design-check.cjs`, `/tmp/backer-v5-finish-capture.cjs`. This documents local visual work, not deployment or complete translation acceptance; those require the final artifact checks.

## CJK visual acceptance

Independent Chinese, Japanese and Korean review covered the overview at 1440, 390 and 320 px, all four scene stages and all four scanner records. All 36 stage captures had zero SVG text collisions. The smallest measured gap between scanner quote text and its footer was 62 px. Header controls stayed in normal flow, and no page overflow was detected.

A further 72 route/viewport combinations covered five use-case scenes and all three paper figures across the same languages and widths. Reviewed direct interactions included sending messages, connecting traits and inserting a timed event. No visible SVG text collisions, page errors or page overflow were found. Hidden desktop-only diagram labels are excluded from geometry checks.

CJK refinements include one-line scanner action labels, stable tree connectors, Korean word boundaries, shorter mobile hero spacing, and Japanese phrase-aware heading wrapping where the browser supports it. Browsers without phrase-aware wrapping retain standard Japanese line breaking.

CJK evidence: `/tmp/backer-v5-cjk-overview/` and `/tmp/backer-v5-cjk-figures/`, each containing a structured `report.json` and local screenshots.
