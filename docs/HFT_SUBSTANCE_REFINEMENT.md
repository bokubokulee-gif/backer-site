# Published HFT page: substance refinement

24 September 2026. Local review completed; user subsequently authorized replacing the live version on both hosts. Release checks are recorded below.

## Base and scope

The user explicitly selected the published page as the base. The HTML in source commit `9717176` matches the GitHub Pages page retrieved during the comparison (SHA-1 `5039a576b8b015f26ff5bd83ce3410813047770c`). Work is isolated in `hft-substance-20260924`. The separate `backer-research-lab` implementation was left unchanged.

Preserved: contextual individual histories, history inclusion/withholding, event controls, population composition, the sequential participant ledger, the six-step Jev guide, study figures, freshness gate, shared localization and navigation.

Added: a specific event-response research case; separate participant and fund decisions; the proposed response-to-flow-to-economic-value chain; data feasibility; a fund-alternative accounting example with spread, fees and partial fills; typed fixture/optional local Jev judgments; an inspectable API dialog; a bounded pilot with benchmark, holdouts, economic criteria and prospective shadow evaluation.

## Claim ledger

| Visible claim or output | Evidence class | Support and boundary |
| --- | --- | --- |
| Behavioral histories could improve entry/exit timing | Future hypothesis | Framed as a proposed comparison with the fund's current signals. No human prediction or profit result is claimed. |
| Company guidance case; participant and fund alternatives | Illustrative research design | Narrative example. No real issuer, account or actual trading recommendation. |
| History records, holdings, response probabilities, population counts | Authored synthetic fixtures | Existing `js/hft-model.js`; history-off distributions ignore profile differences. Four observation categories include missing records, which are not actions. |
| Typed Jev Choice and probabilities | Documented interface | Current TypeSafe API, Choice, state and model docs reviewed. Fixed English question targets participant behavior. Confidence describes concentration, not correctness. |
| Model abstention, missing observation and Hold are distinct | Interface/evaluation design | Choice contains abstain; recorded response displays preserve missingness. No synthetic scoring UI is presented as learning/calibration. |
| Optional local adapter | Implemented scope | POST accepts three selectors only; server rebuilds state. Same versioned model/question for every UI language. History withheld removes profile identity and all history records from provider state. |
| Shared authored fund paths | Synthetic arithmetic | Every Add/Hold/Reduce branch starts with 100 shares + $5,000 under one selected exogenous path. No participant output causes a price move or chooses a fund action. |
| Fill, spread, fee and end-value readouts | Synthetic arithmetic | Ten-share request cap; normal depth 10 and spread $0.20; thin depth 3 and spread $0.80; fee 0.1% of filled value. No borrowing/shorting. No venue, queue, impact or profitable-strategy claim. |
| Participant ledger carries state forward | Synthetic arithmetic | Existing fixed-price, ten-share, zero-fee demonstration retained. The new fund comparison is a separate account. |
| AI-fund study coefficients | Sourced research context | Existing `HFT_PAPER_AUDIT.md`, NBER 35273 Table 5 and visible intervals retained. No causal claim about AI commoditization or proof of Backer's thesis. Source is linked. |
| Predictable behavior does not establish predictable returns | Sourced research context | Lillo/Farmer, https://arxiv.org/abs/cond-mat/0311053 . Size/liquidity can compensate for predictable order direction. |
| Execution timing/freshness | Proposed design + synthetic example | One-second lifetime remains illustrative. No app latency or HFT execution performance promised. |
| Pilot protocol and go/no-go deliverable | Proposed service scope | Data availability, rights, universe, event, horizon and criteria must be agreed. No customer count, owned dataset, production availability, price or delivery date invented. |
| API/Contact CTAs | Implemented navigation | Native dialog shows bundled contract and optional local GET contract. Contact uses existing localized same-host waitlist destination. No form submitted. |

Primary TypeSafe sources: https://docs.typesafe.ai/api , https://docs.typesafe.ai/primitives/choice , https://docs.typesafe.ai/concepts/state , https://docs.typesafe.ai/confidence , https://docs.typesafe.ai/models . Vendor/cookbook examples are not Backer performance evidence.

## Public artifact review

Reviewed changed model and presenter code and new contract/client: all records and calculations are synthetic or drawn from the existing cited paper. No credentials or private records are bundled. `server/`, `scripts/`, `tests/` and `docs/` are not served by the preview or emitted as static files. The fixed provider request and key handling stay in Node. The artifact manifest pins the reviewed minified bytes, including the two new allowlisted browser files. The static publication remains a synthetic demo. The optional inference adapter is loopback-only and is not a hosted inference service.

## Run locally

Use Node 20 or newer, with the declared project dependencies installed. In this worktree:

```sh
node scripts/build-pages-artifact.mjs .public-artifact
node scripts/serve-hft-preview.mjs
```

The builder requires an absent or empty output directory. Keep an existing artifact as a backup before rebuilding. Default preview: http://127.0.0.1:4191/use-cases/high-frequency-trading.html?lang=en . Languages: en/zh/ja/ko. `BACKER_HFT_PORT` selects another loopback port. Set `TYPESAFE_API_KEY` only in the server environment to opt into real inference; it is deliberately empty for this verification run. The default simulation needs no key.

## Verification completed

- 42/42 model and mocked API/server tests passed, including all existing HFT model tests.
- The 225-file public artifact built successfully with zero exposure violations; lint and `git diff --check` passed.
- EN/ZH/JA/KO rendered at 320, 390, 768 and 1440 CSS-pixel widths with no horizontal document overflow or missing-value strings. All 262 HTML/meta/ARIA source strings have complete CJK catalog entries; new client-facing strings are translated. Raw API/SDK code remains intentionally canonical English.
- Actual narrow Chinese narrative and fund-account renders and the desktop decision-bridge render were visually inspected. These are browser/viewport checks, not physical-device tests.
- Native language switching EN/ZH/JA/KO was exercised; unsupported locale falls back to English. The published site's existing navigation/reload behavior is retained.
- Enter and Space operate fund controls; selection rerenders retain focus with a visible 2px outline. Thin depth fills 3/10 shares on either side and exposes cost/cash/inventory results.
- API dialog opens by keyboard, cycles Tab/Shift+Tab within its controls/code blocks, closes with Escape and returns focus to the opener. It loads the local contract; no contact form was submitted.
- No-key request returns an explicit fixture-preserving error. A browser-intercepted mock success displayed the typed model distribution and did not change the independently selected fund action. An input change cleared the prior judgment. An expired mocked request was safely ignored. All interception and emulation were cleared afterward.
- Reduced-motion emulation yielded scroll-behavior:auto. No Runtime.exceptionThrown events were returned during the final browser check.
- The local server runs on 4191 with an empty API key. No actual Jev inference, real trading, push, deployment or publication occurred. Final review page is restored to English fixture mode.


## Final copy and release preparation

- Applied the user’s exact English hero edits: “Public information” and “behavioral history of traders”.
- Applied “Backer Simulation thesis” and “Simulate traders. You have your alphas.” to the thesis headings, with corresponding Chinese, Japanese and Korean translations. The headline is the product thesis; the surrounding research boundaries still state that trading advantage is unproven.
- Constrained thesis grid children to the available width and allowed long localized text to wrap. This applies at all viewport sizes without a new breakpoint.
- Re-ran all 42 HFT model/API tests, lint and the public artifact audit before release.
- Preserve the newer simulation changes on remote main during integration. Release completion requires deployment and browser verification on both canonical hosts.
