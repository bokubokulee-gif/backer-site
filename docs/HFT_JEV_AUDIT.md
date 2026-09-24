# Backer simulation + Jev: evidence and implementation audit

Initially reviewed 2026-09-23; complete supplied article audited 2026-09-24 (see final section). Scope: public sources, live TypeSafe documentation, and a local mocked SDK check. No live inference, brokerage, wallet, funded trade, or performance backtest was run.

## Verdict

The composition is technically credible as a research and event-response layer: Backer supplies behavioral evidence and a fitted simulation, while Jev turns relevant text and application state into narrow, typed features. This is not evidence of tradable alpha, a proven model of actual traders, or a competitive HFT execution system.

Use the requested title **High Frequency Trading supports**, with a clear scope line such as **Behavioral scenarios for systematic research and execution context.** The defensible claim is support for funds' research, scenario stress tests, and slower supervisory decisions. A hosted semantic API should not be represented as the exchange execution path.

## Access to the supplied Medium tutorial

Requested URL: https://algoinsights.medium.com/build-a-24-7-hft-trading-system-with-jev-a-step-by-step-guide-242d30cd0c5e

The original URL timed out across web, direct retrieval, Jina and the in-app browser on the first pass. On 2026-09-24 the user supplied the complete article text as an attachment, and it has now been read and audited directly. The final section records concrete SDK errors, corrected formulas and cost arithmetic, and a working offline Backer decision-loop example. Images and linked implementations were not included in the pasted text. No paywall bypass was used.

## What current TypeSafe documentation supports

Sources:
- https://docs.typesafe.ai/llms.txt
- https://docs.typesafe.ai/api.md
- https://docs.typesafe.ai/models.md
- https://docs.typesafe.ai/sdk/python.md
- https://docs.typesafe.ai/sdk/python/api/clients/sync.md
- https://docs.typesafe.ai/primitives/choice.md
- https://docs.typesafe.ai/confidence.md

`POST https://api.typesafe.ai/v1/systemone` accepts `state`, a model ID, and named typed `questions`. Choice selects an enumerated option and returns its distribution and confidence; Noul returns a yes-probability; Score returns a probability-weighted rubric position. Questions can share one request, but cannot consume another question's answer within that request. Jev does not converse or produce explanations. Code must own the workflow.

At review, the model page identifies `jev-1.13.0`; `jev-latest` is a moving alias. Pin versions for reproducible evaluation. The documented common-model service is not fine-tuned on a client's data; proprietary behavior belongs in request state and/or a separate downstream model. Current request limits and language quality require measurement on the intended workload.

### Latency and HFT

Primary source: https://typesafe.ai/blog/introducing-system-one-models-and-jev

The vendor reports **70–500 ms end-to-end response time** and notes that its published evaluations generally ran from laptops on the US West Coast, where the service is based. This is a vendor workload result, not a sub-100 ms guarantee, a p99 SLA, or a measured Backer result. Parallel question execution does not make network transport, queueing, data acquisition, retries, or venue execution disappear.

Primary venue reference: https://www.nasdaq.com/products/north-american-markets/connectivity/co-location

Nasdaq advertises sub-50 microsecond order-to-ack and order-to-tick latency on its co-location network. These measure a different subsystem from hosted AI inference; do not present a head-to-head benchmark. They do establish why a 70–500 ms service should be treated as supervisory context for an HFT stack, not its latency-critical quoting loop.

Architecture implication: deterministic execution continues independently under risk limits. Timestamp, expire, and version each inference result before any downstream use. Evaluate p50/p95/p99 across locations, payload sizes, concurrency, busy market windows, and retry behavior. No such benchmark was run here.

### Confidence and truth

Source: https://docs.typesafe.ai/confidence.md

Choice/Score confidence summarizes concentration of the output distribution. It is not the probability of a profitable trade, permission to place an order, a measured trader population proportion, or a guarantee of correct interpretation. A narrow option set can produce a confident wrong answer. Noul has no separate confidence field. Choose abstention and routing thresholds using task-specific labels and losses.

Source: https://docs.typesafe.ai/model-jaggedness/jev-1.13.md

The vendor documents literal interpretation, numeric/date difficulties, indirection, irrelevant-context degradation, adversarial text sensitivity, and inconsistent relations across independently worded questions. Arithmetic, ordering, price/quantity constraints, inventory, and risk limits belong in code. Typed output constrains syntax and options; it does not establish semantic truth. This rules out page claims that Jev or frontier AI is omniscient, always correct, or universally rational.

## Offline SDK check actually performed

Installed `typesafe-sdk==0.7.1` and its dependencies only inside `/tmp/backer-jev-audit-venv`.

Script: `/tmp/backer-jev-interface-check.py`

Evidence: `/tmp/backer-jev-interface-check-output.json`

Result: **PASS**, with an `httpx2.MockTransport`, fake non-secret fixture key, synthetic input, and a deliberately constructed response.

Confirmed:
1. Choice/Noul/Score construction with current SDK classes.
2. Serialization of one batched request to `POST /v1/systemone`.
3. Versioned model field `jev-1.13.0`.
4. Typed response access and Choice probabilities.

No external network call occurred during the test; no order was created. The fixture output is not model output. This test does not establish live service access, behavior prediction, trading calibration, profitability, latency, or reproduction of the full article’s system. The later complete-text review below checks its actual SDK snippets.

## Initial architecture review before the complete article was supplied

The following records the initial engineering review of a public synopsis. The complete-text audit appended below supersedes its access limitations and reviews the actual supplied code.

| Proposal | Assessment / needed correction |
| --- | --- |
| Deterministic math plus model judgment | Sound division. Exact indicators, timestamps, quantities and risk remain in code. |
| Small causal state snapshot | Sensible, but a token limit alone does not prevent leakage. Preserve publication/arrival times, availability timestamps, and the decision cutoff; distinguish event time from receipt time. |
| Six parallel judgments | Supported by the interface. Regime, direction, toxic flow, liquidity, quotation conditions, and inventory pressure need separate labels/definitions; correlation and disagreement remain possible. Independent questions are not joint inference. |
| Under-100 ms decisions | Not a general guarantee in primary docs; vendor range is 70–500 ms. End-to-end freshness must include full pipeline latency. |
| Kelly sizing directly from model probabilities | Unsupported. Classification confidence is not a calibrated after-cost win probability; a payoff distribution and estimation uncertainty are also needed. Even measured calibration can shift out of sample. |
| Avellaneda–Stoikov quoting in code | A possible baseline, not proof of edge. Correct units, horizon, volatility, fill intensity, inventory bounds, fees, tick size, queue position, and venue assumptions need testing. |
| Fallback on late/down model | Necessary but incomplete. An expired result must not overwrite newer state. Retrying should respect deadline; preventing duplicate/late orders and reconciling partial fills matter. |
| Flatten on drawdown | A policy requiring defined data, acknowledgements, inventory reconciliation and venue handling; market orders may themselves increase costs in stress. It is not sufficient to claim a robust kill switch. |
| Sharpe/Sortino/hit rate/backtest | Useful outcomes but insufficient alone. Test leakage, queue/fill assumptions, costs, selection bias, capacity and distinct periods/regimes. |
| Brier score/ECE | Useful for explicitly defined binary/multiclass outcomes. Report coverage, time splits, reliability curves and uncertainty; trading performance requires a separate test after costs. |

## Recommended Backer architecture

**Observed behavior → bounded semantic features → fitted response model → scenario distributions → research API → fund policy and execution.**

1. **Evidence and cutoffs.** Use permissioned, de-identified trading histories with positions, timing, executed actions, and (where available) contemporaneous decisions or recommendations. Record the evidence actually available at each decision, event publication/arrival times, venue state, cohort definition, missingness and consent/data rights.
2. **Deterministic features.** Compute position changes, prior reaction times, concentration, cash constraints, realized P&L, drawdowns, trend exposure and market microstructure features in code. Aggregate cohorts without exposing a person's private record.
3. **Jev features.** Ask narrow questions about information interpretation: whether an event concerns a held company, what kind of business change a passage describes, whether guidance conflicts with an existing stated thesis, whether a recommendation explicitly asks for an action, or which supported reaction class best matches supplied precedents. Include `insufficient_evidence`. Keep direct synthetic reaction answers marked as hypotheses until validated.
4. **Backer estimation.** Train/calibrate a separate response model against observed actions and reaction times, conditional on information, portfolio constraints, cohort and market regime. Jev probabilities are candidate features; they are not observed behavior frequencies.
5. **Simulation.** Sample action, timing and size distributions from the validated response model. Aggregate them into scenario demand/flow distributions using documented sampling weights and impact assumptions. The simulation is conditional, not a causal claim about a hypothetical event unless identification supports that interpretation.
6. **API and execution context.** Return scenario probabilities/quantiles, evidence coverage, horizon, timestamp, expiry, version and uncertainty. Funds can compare to market-only baselines and use approved context in their own research/risk policy. Keep actual order placement outside this public prototype.
7. **Model progression.** Future Jev/LLM versions become challengers in a fixed replay/holdout protocol. Promote only when they improve behavior forecasting or useful net trading outcomes at acceptable latency/cost. More capability can also make strategies more crowded or erase an existing edge.

Closest primary cookbook: https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery.md . It demonstrates turning textual judgments into numeric features for a separate supervised model with held-out evaluation. It uses wine reviews, not traders; its performance is not transferable evidence for finance.

## What would validate the new-edge hypothesis

Define behavior targets first: realized add/reduce/no-action classes over stated horizons, reaction-time distributions, signed net flow and size conditional on holdings. Compare at least market-only features, behavior-history features without Jev, generic-persona simulation, and full Backer-plus-Jev. Use chronological walk-forward splits, event/cohort holdouts, purging where labels overlap, and a final untouched period. Keep the selection and prompt-tuning loop out of the final test.

Evaluate log loss/Brier, reliability by cohort/event/regime, interval coverage, action timing and flow error. Then test whether the improvement survives bid/ask spreads, fees, delay, fill probability, queue assumptions, market impact and capacity. Track signal decay and stress regime shifts. Private trade-history access, representative coverage, and sufficient labels have not been established in this audit.

A research diagram may show illustrative distributions, but should label them **Illustrative scenario · synthetic data · not a forecast or backtest**. Never label a hand-built simulation as a measured Jev prediction.

## Suggested concise thesis language

> When everyone can read the filing, the next question is how they will act.
>
> Better AI may compress the advantage in processing public information. Investors still differ in holdings, constraints, attention and willingness to act—even when they delegate execution. Backer studies whether those differences can become measurable signals.
>
> Backer’s proposed stack combines observed behavior, Jev’s typed judgments and a response model tested against real actions. The target is a distribution of reactions: who adds, who reduces, who waits, and when.
>
> A candidate source of alpha, tested after costs.

Avoid implying that historical alpha came only from company facts; behavioral finance and order-flow models already exist. The differentiated hypothesis is the quality, permission, representativeness and update speed of Backer's behavioral evidence and its incremental predictive value. Avoid saying all hedge funds have lost their edge; the reviewed paper's sample-specific evidence needs its own scope statement.

API CTA may say **We’re opening API access. Contact us to discuss a research integration.** This communicates planned access without inventing a public endpoint or released live product.

## Architecture correction after user review

The original recommendation above concentrated on event features and underrepresented the requested product thesis. The current design also places Jev directly inside Backer's trader simulation as a bounded next-choice primitive. Backer supplies accumulated individual observations and current market/portfolio state; Jev selects from explicit actions; code advances simulated state; observed outcomes support calibration. See `HFT_JEV_DECISION_LOOP.md` for the current primary-source design and exact request contract. The public demonstration uses authored choices, not live inference.


---

# Supplied Jev guide: complete-text audit and Backer implementation recipe

Reviewed 2026-09-24 against the complete user-supplied text of Algo Insights’ *Build a 24/7 HFT Trading System With Jev: A Step-by-Step Guide*. The original URL was inaccessible on the previous pass; the attached text now permits direct review. Images and linked third-party implementations are not included in the attachment. No live inference, credentials, venue connection, or trading was used.

## Verdict

Use the article’s core composition: code prepares state, Jev makes bounded judgments, code applies the result and advances the simulation. Adapt it to **a specific trader’s accumulated decisions**, not a generic market-regime bot. The article’s exact Python does not run with the current SDK, and its cost, deadline and trading-quality claims should not be copied into the page.

## Exact interface, verified now

- Python 3.10+, `typesafe-sdk==0.7.1`, current pinned model `jev-1.13.0`. `TypeSafeClient()` reads `TYPESAFE_API_KEY`; `jev-latest` is the moving default. Credentials and calls belong on the backend. [Python SDK](https://docs.typesafe.ai/sdk/python), [PyPI](https://pypi.org/project/typesafe-sdk/), [models](https://docs.typesafe.ai/models).
- `client.system_one(model=..., state=..., questions={...})` serializes to `POST https://api.typesafe.ai/v1/systemone`. Each question is independently evaluated against the same state. Question IDs are response lookup keys; the model does not see them. [API](https://docs.typesafe.ai/api), [state](https://docs.typesafe.ai/concepts/state).
- `Choice(instructions=..., criteria={option: description})` returns `.choice`, `.probabilities`, `.confidence`; the choice is the highest-probability option. `Noul(instructions=...)` returns `.noul`, the probability of yes, without a separate confidence field. `Score(instructions=..., criteria=[ordered descriptions])` returns `.score`, `.probabilities`, `.legend`, `.confidence`; score is an expected **level index**, not a probability or elapsed time. [Choice](https://docs.typesafe.ai/primitives/choice), [Noul](https://docs.typesafe.ai/primitives/noul), [Score](https://docs.typesafe.ai/primitives/score).
- Exact Python access: `result.choices['next_action'].choice`, `result.nouls['wait_for_confirmation'].noul`, `result.scores['reaction_urgency'].score`. `result.answers[key]` is also supported. The response’s `model` and token `usage` should be logged. [Response types](https://docs.typesafe.ai/sdk/python/api/types/responses).

## Concrete Backer walkthrough for the page

1. **Freeze one trader’s evidence.** Accumulate what the person actually traded, when, with what holdings, available cash, and information. Freeze the observed-history cutoff before the scenario event; exclude later outcomes. Keep both event and information-availability timestamps. This is the proprietary input to the loop.
2. **Place them in a market situation.** Add the announcement visible now, prices, liquidity, session horizon and current simulated account. Code computes exact arithmetic and removes infeasible actions. An identical company announcement can then meet different individual histories.
3. **Ask three independent questions in one request.** `Choice`: what does this trader do next—add, keep, reduce, or insufficient evidence? `Noul`: will this trader wait for a second confirming signal before changing exposure this session? `Score`: when will the first change occur, using explicit ordered timing bins? Each question must state its own target; none consumes the other answers.
4. **Read typed answers.** Keep the entire action distribution; the selected option is only its maximum. Treat confirmation waiting as a separate predicted behavior, not a mind-reading claim. The timing Score is an ordinal summary; retain its bin distribution for evaluation. Inspect incompatibilities between answers rather than pretending independent marginal judgments form a joint distribution.
5. **Advance with code.** Apply the chosen or calibrated sampled action through an execution model. Update shares, cash, fees, market time and, where modeled, market impact. Keep simulated decisions separate from observed history. `insufficient` creates an unresolved branch, not a fabricated hold. Raw probabilities should not be multiplied into a joint action/timing process without a validated coupling model.
6. **Send the new state.** A later decision depends on those updates and therefore needs a **new request**. Independent actors may run concurrently at a frozen market snapshot; endogenous market impact requires a defined update schedule. [Fan-out](https://docs.typesafe.ai/patterns/fan-out).
7. **Compare, accumulate, recalibrate.** When real trades arrive, compare action, size and reaction time with the stored forecast, then add the observation to future histories. Test chronological holdouts, event and trader holdouts, calibration, and no-history baselines. Compare future model versions on the same held-out labels. Probability quality and after-cost trading value remain separate measures.

The final Noul targets confirmation waiting. An earlier design considered “panic response”; it was rejected because an observed sale does not identify private emotion. Jev returns answers, not rationales. Explanations must come from recorded reasons, inspected evidence or controlled input comparisons.

## Article corrections

| Article item | Direct finding / corrected use |
| --- | --- |
| `Score(..., legend={...})` in both code examples | **Invalid in current SDK.** Construction fails before any request: `criteria` is required and `legend` is forbidden. Use `criteria=["No", "Marginal", "Standard", "Excellent"]`. `legend` belongs to the response. |
| `compose_action` as pasted | **Does not compile**: unindented `q = ...` is followed by an unexpectedly indented `if`. Also contains undefined policy constants/functions and no complete runnable system. The indentation may be a copying artifact; it is still invalid in the supplied text. |
| Six questions, one latency | Batching is supported and usually changes latency little; exact equality is not promised. The 12.2× saving cited in the docs is a 13-question GDPR example, not a six-question trading benchmark. [Parallel-question cookbook](https://docs.typesafe.ai/cookbooks/parallel_questions). |
| 32,000-token context | Current limits are **64k total request; 32k state plus the longest question**. Input/question length still affects cost and can affect quality. [Models](https://docs.typesafe.ai/models). |
| A 300ms block with room for execution | Vendor 70–500ms end-to-end measurements do not guarantee a 300ms deadline; the upper end already exceeds it. Measure network, data arrival, inference tail latency, code and venue acknowledgement together. Preserve original expiry across retries; reject a result superseded by newer state. [Vendor evaluation context](https://typesafe.ai/blog/introducing-system-one-models-and-jev). |
| $10–25/month at every block | The article’s own `$0.00001/call` means **$86.40/month at 300ms** or **$64.80 at 400ms**, over 30 days. At the current $0.042/M input tokens, a **400-token state alone** costs $145.15 or $108.86 respectively, before question overhead. Smaller actual input/duty cycle changes costs; no Backer workload was benchmarked. [Current price](https://docs.typesafe.ai/models). |
| Frontier-level accuracy / 67.8% agreement | Vendor workflow agreement with frontier-model consensus is not observed trader accuracy, return prediction or hedge-fund performance. The published methodology explicitly uses model consensus rather than ground-truth classification. Exact quoted table numbers were not independently reproduced. [Evaluation methodology](https://typesafe.ai/blog/introducing-system-one-models-and-jev). |
| High confidence means reliable trading / no context-rot | Output confidence measures distribution concentration, not financial truth. Independent questions can disagree; context length, task mismatch and numerical reasoning remain documented weaknesses. [Confidence](https://docs.typesafe.ai/confidence), [jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13). |
| Noul for “book thinner than 24h norm?” | If depth and a defined baseline are available, compute this comparison in code. If the baseline is absent, the model cannot supply that missing evidence. |
| Fractional Kelly as `(2p−1)` capped at a quarter | This expression assumes a binary even-payoff bet; a probability of an action, regime or price direction is not a complete payoff distribution. “Quarter Kelly” means scaling a justified Kelly fraction by 0.25, not merely capping it at 0.25. Do not include a sizing rule in Backer’s behavioral explainer. |
| A–S “half spread” formula | The article labels `γσ²(T−t)+(2/γ)ln(1+γ/κ)` a half spread. The original paper’s equation (30) gives **the full bid–ask spread**, `δa+δb`. Using it as each side’s distance from the reservation price doubles the intended total spread. [Original paper, p. 221, equations 29–30](https://math.nyu.edu/inmemoriam/avellaneda/HighFrequencyTrading.pdf). |
| Gas loss, waitlist approval time, bots/frameworks, 24/7 readiness | Claims about 428 MON/hour, same-day access, AgenKit or the linked bots are not reproduced by the supplied snippets or this audit. Do not attribute those results to Backer. A module diagram does not establish operational readiness. |

## Working examples and completed checks

- `/tmp/hft-guide-page-example.py`: 36-line first-call example for the page. Compiled and executed with an injected mock client, checking the exact serialized request and typed answer access. **PASS**.
- `/tmp/hft-guide-example.py`: self-contained offline two-step reference using `httpx2.MockTransport` and a fake fixture key. **PASS**, two mocked requests, zero external API calls, zero orders.
- First authored choice sells 10 shares at $94 with a $1 assumed fee: 100 shares/$5,000 becomes **90 shares/$5,939**. A second authored hold preserves those balances. Additional checks cover buy accounting, zero-balance feasibility, abstention, future-history rejection, and input immutability.
- Evidence: `/tmp/hft-guide-example-output.json`, `/tmp/hft-guide-check-output.json`. SDK 0.7.1 is also the version returned by PyPI during this review.

These checks validate SDK compatibility and deterministic transitions. They do not measure Jev’s behavioral predictions, a production execution model, model latency or alpha. Any displayed example answers must remain labeled as authored. A firm product thesis can coexist with this precise scope.
