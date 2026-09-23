# Backer simulation + Jev: evidence and implementation audit

Reviewed 2026-09-23. Scope: public sources, live TypeSafe documentation, and a local mocked SDK check. No live inference, brokerage, wallet, funded trade, or performance backtest was run.

## Verdict

The composition is technically credible as a research and event-response layer: Backer supplies behavioral evidence and a fitted simulation, while Jev turns relevant text and application state into narrow, typed features. This is not evidence of tradable alpha, a proven model of actual traders, or a competitive HFT execution system.

Use the requested title **High Frequency Trading supports**, with a clear scope line such as **Behavioral scenarios for systematic research and execution context.** The defensible claim is support for funds' research, scenario stress tests, and slower supervisory decisions. A hosted semantic API should not be represented as the exchange execution path.

## Access to the supplied Medium tutorial

Requested URL: https://algoinsights.medium.com/build-a-24-7-hft-trading-system-with-jev-a-step-by-step-guide-242d30cd0c5e

- `web.open` returned inaccessible.
- Agent-Reach's documented Jina reader route timed out without an article response.
- A direct `curl` attempt also timed out without content.
- Root also attempted the supplied URL in the in-app browser; navigation timed out after 30 seconds.
- Therefore the exact tutorial text, its code, imports, endpoint, models, and claimed results are **not audited**. Do not say the Medium implementation was reproduced or validated. No paywall bypass was attempted.

Search found a separately indexed public synopsis associated with Roan/@RohOnChain: https://www.shipwithjev.com/builds/i-built-a-24-7-hft-trading-bot-with-jev . It describes a six-question trading battery and deterministic execution, but its identity with the requested Medium article is unconfirmed. Treat this as discovery context only, not as a substitute for the missing article. Do not carry over its reported trading success.

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

No external network call occurred during the test; no order was created. The fixture output is not model output. This test does not establish live service access, behavior prediction, trading calibration, profitability, latency, or compatibility of inaccessible Medium code.

## Audit of the separately accessible trading claims

The following are engineering judgments about the public synopsis, not an exact code review of the supplied Medium article.

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
