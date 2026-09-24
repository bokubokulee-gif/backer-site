# High Frequency Trading supports

## Current refinement — 24 September 2026, local review only

This instruction supersedes earlier launch notes below: refine the published HFT page as the base, import the useful mechanics from the Research Lab prototype, and preview locally. Do not deploy, push or publish. The base HTML matches the published GitHub Pages page retrieved for the comparison.

Lead with a proposed event-response pilot for a fund's entry/exit timing. Preserve the contextual trader histories, history-on/off comparison, cohort illustration and sequential ledger. Explain separately what participants may do and what the fund might do with that information. Bridge the proposed research through direction, size, timing, coverage and liquidity; do not label counts as tradable flow or authored prices as forecasts.

Add a reader-controlled comparison of the fund's alternatives under identical authored paths, with explicit spreads, fees, limited fills, cash and inventory constraints. Keep this hypothetical fund account separate from simulated participant behavior. Add a readable typed Choice contract and an optional local-only server adapter; all keys remain server-side, missing service stays explicit, and no judgment automatically selects or executes a fund action.

Clarify dataset feasibility and current status: synthetic fixtures and a modeling interface exist; a proprietary dataset, production feed, commercial beta and profitable signal are not established here. Distinguish observed Hold, missing records and model abstention. Do not import the Lab's toy scoring as evidence of learning or calibration.

Define a bounded pilot: agree data rights/coverage, instruments, event family and horizon; freeze the fund's existing benchmark; compare with/without history and against a simple behavioral model; evaluate unseen future events plus prospective shadow decisions; measure forecast quality and net economic value with pre-agreed go/no-go criteria. Retain the AI study as context rather than proof of the behavioral thesis.

Acceptance: all English/Chinese/Japanese/Korean copy complete, existing interactions preserved, typed/provenance/error and accounting tests pass, browser language/keyboard/mobile checks pass, claim ledger refreshed, bottom Open research API and Contact us CTAs work. No website redesign or changes to other use cases.

Status: implemented and verified locally, 23 September 2026. See HFT_VALIDATION.md for evidence and access limits.

## Purpose

Add a sixth Backer Research use case for quantitative and discretionary funds. Explain and make inspectable the hypothesis that behavioral histories can add predictive information about investor responses to company events. Preserve the existing static site, dark Backer identity, and English, Chinese, Japanese and Korean editions.

Sequence: source learning and claim audit → this PRD → implementation → functional and rendered verification. Build in an isolated checkout of current origin/main (50da9a6). This request authorizes a local build; publication is a separate action.

## What we learned

1. Chen, Sialm and Xu, *The Growth and Performance of Artificial Intelligence in Asset Management*, NBER working paper 35273, May 2026. Table 5 compares disclosed AI and non-AI hedge funds after controls. Fung–Hsieh relative monthly alpha is +49.6 bp before 2018 and −8.3 bp during 2018–2024; the latter is not significant. AQR equivalents: +48.8 and −2.9 bp. These are relative coefficients, not absolute AI returns. The paper does not establish that all funds lost their edge or evaluate HFT or retail LLM assistants. Declining advantage is consistent with competition; the mechanism is not causally established. Low monthly correlation cannot exclude intraday crowding or tail risk. [Paper](https://www.nber.org/system/files/working_papers/w35273/w35273.pdf)
2. Jev answers narrow typed questions. Choice selects an option and supplies probabilities and concentration-based confidence; it does not converse or generate an investment rationale. Schema validity is not factual correctness, a behavioral frequency or expected profit. Keep calculations, time comparisons, risk limits and execution in deterministic code. [Choice](https://docs.typesafe.ai/primitives/choice) · [Confidence](https://docs.typesafe.ai/confidence) · [API](https://docs.typesafe.ai/api)
3. The vendor's launch article reports 70–500 ms end-to-end in its evaluation context, not a trading latency SLA. Use hosted semantic judgments upstream of latency-critical execution. Measure deployment-specific tail latency and stale-result rates. [Vendor article](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
4. The supplied Medium tutorial could not be read. Web, reader, direct retrieval and browser content extraction failed; no unseen code, performance or profitability claim may be described as verified. [Supplied tutorial](https://algoinsights.medium.com/build-a-24-7-hft-trading-system-with-jev-a-step-by-step-guide-242d30cd0c5e)
5. Existing Backer research separates attention, belief, action, order flow and price impact. A plausible persona does not establish a valid forecast. Trading histories are incomplete observations; exposure, holdings, resources, horizon and delegated policies matter. Existing funds already study behavior, sentiment and order flow. Our hypothesis is incremental predictive value, not the invention of behavioral finance.

## Thesis and boundaries

As AI-assisted company analysis becomes more accessible, differences in investor response may remain economically useful. The same information can produce different choices because positions, liquidity needs, attention, past decisions and delegation rules differ. People can execute themselves or delegate execution; neither requires a human click per order.

Proposed foundation: evidence-grounded Backer behavioral simulation + Jev's typed semantic judgments + future models admitted through prospective evaluation. More capable models may improve measurement and coverage; they can also accelerate adaptation and signal decay. Do not assume omniscience, rationality, correctness, or durable alpha.

The public page is an interactive research explanation. It has no live Jev call, private trader data, trading suggestions, broker connection or executed order. Illustrative probabilities are authored fixtures. The proposed API is opening for early access; do not invent an endpoint, uptime commitment or production availability.

## Page structure and interactions

Route: `use-cases/high-frequency-trading.html`. Research list label exactly **High Frequency Trading supports**. Page title **High Frequency Trading**; hero thesis **Same information. Different trades.**

1. Hero: a compact branching response illustration and concise thesis. Quantitative and discretionary funds are named. Clearly state research-support scope.
2. Evidence: switch between Fung–Hsieh and AQR; chart pre/post relative alpha with zero line and approximate 95% intervals calculated from reported standard errors. Show exact table values accessibly and describe the statistical uncertainty. Never fabricate an annual performance line.
3. Behavioral experiment: choose one of three company events, then one of three synthetic investor profiles. Show buy/hold/reduce/no-action distributions, observed-history assumptions, and a visible model-with/without-history comparison. No real forecast or implied return. Event and profile choices directly change the illustration. All values sum to 100%; an outside option is present. Expose assumptions and values.
4. Architecture: select a stage in evidence → Jev judgments → Backer response model → fund controls. Reveal inputs, outputs and a narrow choice example. Jev output is closed-set, not a chat response. Uncalibrated model confidence is never converted directly into sizing or Kelly fractions.
5. Trading clock: distinguish precomputed behavioral context, event-driven updates and latency-critical execution. A simple stale/fresh context choice shows why a fund must discard expired signals. Model retries must not silently extend signal validity.
6. Validation and thesis: frozen information cutoffs, consented/licensed behavioral data, person/time/event-disjoint holdouts, calibration and baseline ablations, realistic replay with spreads/fees/impact/fills, capacity and decay, regime shifts, paper-trading promotion gate. A proposed signal is useful only after incremental out-of-sample and net-cost evidence.
7. Source notes and API/contact block. Source citations are adjacent to empirical claims. Add the same API/contact block to every existing use case. Use verified existing early-access route unless the user supplies another contact destination.

## Visual and engineering contract

- Native HTML/CSS/JS and current Manrope/DM Mono shell. Charcoal, off-white, muted gold; chart series may use neutral distinctions. Strong editorial hierarchy, fine dividers, roomy figures, no generic dashboard/card grid.
- Meaningful manipulation through events, profiles and model selectors. Charts display units, denominators, legend, uncertainty and data status. No decorative stock imagery is needed.
- Keyboard-operable native buttons, visible focus, pressed states, semantic figures, tabular alternatives and polite live summaries. No color-only data distinction. Respect reduced motion.
- Desktop and 390/320 px views; inspect actual renders in all four languages, including dynamic content and navigation. Body copy and chart labels must remain legible; no horizontal page overflow.
- Shared i18n engine, locale propagation and same-host links. Static English content remains readable without JavaScript; interactive failures must not imply live analysis.
- Add all new public assets to build allowlist. Keep research exposure guards, reviewing hashes where applicable. No credentials or internal audit documents in the public artifact.

## Acceptance

- [x] Original paper and supplied tutorial audit recorded, with access limits and tested/untested boundaries.
- [x] Requested Research entry and all use-case navigation paths work in EN/ZH/JA/KO.
- [x] Paper coefficients and intervals match source; authored fixtures are clearly distinct.
- [x] Every event/profile/model/context selection updates its intended graph and readable explanation.
- [x] API opening and contact actions appear on all six use cases and lead somewhere functional.
- [x] Relevant model, localization, public-exposure and site checks pass.
- [x] Desktop/mobile screenshots inspected; keyboard and reduced-motion behavior checked.
- [x] Final report distinguishes built/verified locally from published or empirically validated alpha.

## Refinement and launch brief — 23 September 2026

The user requests stronger conviction, more interactive visual explanation and publication. This supersedes the earlier local-only delivery scope. Publish and verify GitHub Pages and Vercel in English, Chinese, Japanese and Korean.

- Lead with: AI today makes company and industry analysis more accessible. We believe the **EDGE** lies in individual human behavior: how and why people trade. Highlight EDGE in yellow; retain the existing hero headline and Backer identity.
- Replace repeated tentative questions and warnings with a direct account of the behavioral layer we are building. Preserve empirical scope and statistical uncertainty in figure captions; preserve synthetic status and model assumptions next to demonstrations.
- Replace the static hero branch with an interactive investor field: select an announcement or behavioral cohort to see the response change and highlight its history. Reuse the same authored distributions as the main experiment.
- Add a cohort-composition experiment. Equal, momentum-heavy and loss-sensitive populations flow into four action outcomes. A weighted mixture produces expected choices per 100 people and a signed add-minus-reduce count. Do not present counts as order sizes, price changes or measured forecasts. Removing behavioral history must erase composition effects.
- Make freshness visible as a clock diagram with an explicit evidence origin, expiry point and advancing marker. Preserve deterministic admission logic and original expiry on retries.
- Keep interactions keyboard-accessible with text/table equivalents and reduced-motion support. Inspect desktop, 645px user viewport and narrow mobile. Update translations, versioned assets, reviewed public hashes and release evidence before launch.

## Thesis correction — individual traders and accumulated behavior

User feedback: the release under-explained the original thesis and reduced Jev to an event-labeling tool. The Chinese reads as translation rather than a clear investment-research argument. This revision takes precedence over the earlier event-feature-only architecture.

The edge is the accumulated record of individual trading behavior. Backer uses that evidence to model specific traders, places those simulated traders into realistic market situations, and estimates their next decisions and the aggregate response. Events alone and generic personality labels are insufficient. Show the observed history, current holdings/resources, shared market situation and resulting conditional choice together.

Jev is the proposed next-decision primitive within this simulator. It receives a trader's structured state and a narrow question with explicit allowed actions, returns a selected option and probabilities, and lets code own bookkeeping and sequential state updates. This supports repeated, comparable decision steps rather than generating conversations. Backer owns evidence accumulation, actor state, empirical calibration and population aggregation. Inferred reasons remain hypotheses checked against recorded evidence; Jev does not generate explanatory prose.

Implementation: expand the behavioral experiment with individual identities, inspectable chronological trade records, current portfolio constraints and a concrete Jev question/answer example. Add a visual history → simulated trader → real-world scenario → choice → observed-outcome feedback loop. Tie event selection and selected trader to all decision inputs. Keep the public demonstration explicitly synthetic and never label authored fixture probabilities as a live Jev response. Explain why the documented primitive fits this research design. Rewrite Chinese as native editorial copy throughout. Align EN/JA/KO with the corrected thesis, verify and re-publish both hosts.
# Jev guide integration — 24 September 2026

The user supplied the complete Algo Insights tutorial and requested its concrete implementation material inside the Jev section, followed by launch. Replace the generic four-stage architecture tabs with a six-step, interactive reference walkthrough: setup, frozen individual state, parallel typed judgments, deterministic policy, sequential state updates, and calibration. Preserve the individual-behavior thesis and current simulation controls.

The walkthrough must show actual SDK structure, three different primitives, a frozen-state diagram, and selectable delivery/risk states with explicit code-owned outcomes. Adapt the article's market-making decomposition to Backer's purpose: simulating what a particular trader does. Keep observed history separate from simulated state. Clearly distinguish the public authored demonstration from a live inference service. Use original prose, credit/link the supplied article next to the walkthrough, and link current official docs where API details appear. Do not repeat unsupported cost, latency, calibration or profitability claims.

Keep the charcoal/gold visual identity, readable code, direct step selection, visible keyboard focus and mobile stacking. Write natural ZH/JA/KO translations, including dynamic state labels. Place a contextual contact invitation after the walkthrough and retain the API early-access invitation at the page bottom. Validate all steps, primitives and fallback states in four languages, update reviewed script hashes, and publish/verify both canonical hosts.
# Hero redesign: accumulated individual behavior — 24 September 2026

Replace the anonymous cohort-dot hero with one continuous, interactive experiment. Show a specific trader's three recorded trades flowing into a fixed current account, a selectable market event, Jev's bounded next-choice distribution, and a reader-selected simulated account transition. Use signed historical trade sizes, explicitly labeled in shares; do not draw an unlabeled price or alpha curve.

Interactions: choose one of three named fictional traders; inspect any historical record directly in the illustration; change the market event; withhold/reintroduce individual history; trace Add, Hold or Reduce to its fixed-lot account effect. Withholding history must produce the same event-only distribution for every trader. Show the selected choice's difference from that baseline in percentage points. Real observed trades, not simulated outputs, extend future histories. Model improvements belong to this evaluated feedback process, with no claimed performance uplift.

The hero uses a separate three-action authored Choice fixture, rather than reinterpreting the existing observation-missingness category as model abstention. Maintain all existing deeper page controls. New fixture winners agree with the existing demonstration at the common starting account. Every number is an authored teaching example, not a measured forecast or live Jev response.

Visual direction: preserve charcoal/gold, use a broad continuous SVG drawing with HTML controls and readable labels, give the history and the event boundary distinct spatial roles, and make path thickness encode probability. No decorative crowd dots, generic cards or dashboard treatment. Adapt coordinates to container width; preserve 44px targets, keyboard focus, concise localized EN/ZH/JA/KO labels and reduced motion. Verify the 645px annotated view, narrow mobile and desktop renders, then publish the audited artifact to both hosts.
