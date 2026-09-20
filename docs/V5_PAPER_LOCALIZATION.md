# Research papers — V5 editorial and language review

Six articles are available in English, Simplified Chinese, Japanese and Korean:

- `research-lab/method.html` / `thesis.html`
- `research-lab/attention-method.html` / `attention-thesis.html`
- `research-lab/simulation-method.html` / `simulation-thesis.html`

Language is selected with `?lang=en`, `?lang=zh`, `?lang=ja`, or `?lang=ko`. The shared runtime carries the choice through internal links.

## Editorial decisions

Read all six articles, including headings, paragraphs, figure instructions, captions, source notes, buttons and accessibility descriptions. The existing scientific arguments were retained. The revision tightens framing and makes the interactive instructions more direct:

- “Define the contract before the agent” → “Define the event before modeling the trader.”
- “Declare what the share is a share of” → “Define the denominator.”
- “The average person hides the joint” → “The same totals can describe different people.”
- “Confidence must concern error, not conviction” → “Confidence requires a model of error.”
- Each figure now names the scientific object: probability and price, exposure and memory, or the joint distribution.
- Figure instructions describe the direct action and its consequence. Navigation names the destination rather than using promotional prompts.
- Research-status notices are shorter while keeping the distinction between illustrative assumptions and evaluated predictions.

No equation, cited claim, source URL, contract rule or model assumption was changed. No prospective results were added. The JavaScript controller's numeric logic and prose were not edited in this workstream.

## Translation scope

`js/locales/research-papers.js` contains 320 exact-string entries, 16 dynamic patterns and four scoped rich replacements. All 339 unique strings extracted from the final English articles are covered by an entry or pattern. Additional entries cover runtime-only states.

The CJK editions were written for the actual scientific meaning: event probabilities versus action probabilities; observed attention denominators; memory retention; held-out evaluation; joint and marginal distributions; intervention identification; simulation variability versus model uncertainty. Sentence order is adapted to each language rather than preserving English syntax.

Coverage includes page titles and descriptions, article text, navigation, references' explanatory notes, figure instructions, chart labels, keyboard descriptions, ARIA labels, probability readouts, quote inspection, timeline states and population transfers. Bibliographic titles, author names, mathematical notation and identifiers keep their original form. Rich replacements are limited to three paragraphs containing inline variables and one split SVG label; none replaces an interactive control or a citation link.

## Verification

The canonical-string extraction audit found no uncovered strings. A separate headless audit passed all 36 combinations of six routes, three CJK languages and 1440/390 px widths. It found no JavaScript errors, horizontal overflow or untranslated prose. Live quote notes and probability ARIA, exposure playback/settings, and joint-distribution labels and transfer explanations also updated in the selected language. CJK figure renders were visually inspected. Evidence is stored in `/tmp/paper-v5-qa/audit.json` and the accompanying screenshots; root integration verifies the final public artifact.

A second audit passed all 18 CJK page combinations at 320 px after root wired the actual catalog/runtime scripts. It also found no errors, overflow or untranslated prose; live figure updates remained localized. Evidence: `/tmp/paper-v5-qa-narrow/audit.json`.

The trading-method validation section links to the proposed validation protocol and attention preview. Both link labels are included in all three CJK editions.

## Original preview wrappers

`js/locales/research-previews.js` supplements the existing research catalogs with 38 exact messages and two patterns for current framing, interactive scenario descriptions, tooltips, anonymous-marker explanations, source-dialog scope, and illustrative ranges. It also fixes paragraphs that broad legacy patterns had only partially translated. The three page titles now match their current research names; two metadata descriptions were made more specific. Controllers and the external World iframe are unchanged.

Final minified-artifact checks on port 4282 passed:

- 18 paper combinations: six pages × three CJK languages at 390 px, including dynamic quote/ARIA updates, memory controls, joint distributions and inline-variable prose.
- 18 preview-wrapper combinations: three previews × three CJK languages × 1440/390 px, including alternate trading scenarios and attention topics.

Both checks found no JavaScript errors, horizontal overflow or untranslated prose. Proper names, source titles, run identifiers and equations remain in their original form. The externally hosted World iframe was excluded from this shell-language audit. Evidence: `/tmp/paper-v5-artifact-qa/audit.json` and `/tmp/preview-v5-artifact-qa/audit.json`.
