# Backer HFT use case — primary paper audit

Checked 2026-09-23. Learning stage only. No project files changed.

## Sources and versions

- Chen, Shuang; Clemens Sialm; David X. Xu. *The Growth and Performance of Artificial Intelligence in Asset Management*, NBER Working Paper 35273, May 2026. Original PDF downloaded directly from NBER: https://www.nber.org/system/files/working_papers/w35273/w35273.pdf . Landing page: https://www.nber.org/papers/w35273 . DOI: https://doi.org/10.3386/w35273 . PDF has 80 pages: main printed page n is PDF page n+2; internet appendix printed numbering restarts.
- Sialm's current faculty working-paper listing links to the May 2026 version: https://faculty.mccombs.utexas.edu/Clemens.Sialm/ . SSRN author deposit: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5638612 (79 pages; revised May 24, 2026). NBER mirror: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6859837 (80 pages; revised June 15, 2026).
- Local evidence: `/tmp/backer-ai-asset-management.pdf`, page-marked layout text `/tmp/backer-ai-asset-management.txt`. Table 5 and Table 8 rendered and visually verified as `/tmp/backer-paper-pdf-page-47.png` and `...50.png`.
- Caution: an older seminar abstract claims greater AI comovement. The current May 2026 paper finds LOWER comovement. Use the current original paper, not an earlier event blurb.

## What the main chart can accurately show

Table 5, printed pp.44–45 / PDF46–47. Dependent variable: next-month fund alpha, estimated out of sample. The coefficients measure the adjusted difference between AI and non-AI funds, conditional on controls and strategy-by-month fixed effects. All values below are **basis points of monthly benchmark-adjusted performance difference**, not absolute returns, and not net Backer performance.

| Comparison | FH estimate | FH SE | Significance | AQR estimate | AQR SE | Significance |
|---|---:|---:|---|---:|---:|---|
| 2006–2017, AI vs non-AI (cols.3/6) | +49.6 | 15.9 | p<.01 | +48.8 | 22.4 | p<.05 |
| 2018–2024, AI vs non-AI (cols.3/6) | −8.3 | 11.9 | not significant | −2.9 | 12.0 | not significant |
| Full 2006–2024, AI coefficient (cols.1/4) | +8.4 | 11.9 | not significant | +12.0 | 7.6 | not significant |
| Linear time interaction (cols.2/5): change in monthly gap per calendar year | −5.9 | 2.1 | p<.01 | −4.9 | 2.2 | p<.05 |

Approximate 95% intervals computed as estimate ±1.96×reported clustered SE, NOT intervals printed by authors: FH pre [18.4,80.8], FH post [−31.6,15.0]; AQR pre [4.9,92.7], AQR post [−26.4,20.6]. If drawn, label them “Approx. 95% interval; estimate ±1.96 SE”. A simple coefficient plot with two periods and a zero line is appropriate. Do not interpolate an invented annual decay time series, or imply the pre/post difference itself has a published test that was not supplied. Period labels must be 2006–2017 and 2018–2024: the paper's shorthand “Before 2017” means through December 2017.

Suggested compact figure copy: “A disclosed AI edge diminished.” / “Monthly alpha difference versus non-AI peers, after factor adjustment.” / “Post-2017 estimates are not statistically distinguishable from zero.”

## Verified design and scope

- Form ADV analysis: 116,276 Part2A brochures, 2012–2024; 62,253 adviser-years (printed p7/PDF9). Keyword screen plus GPT-5 classification into AI-Autonomous, AI-Augmented, AI Support, AI-Theme Assets, AI Risk Disclosure. First two are AI-driven investing. Categories are mutually exclusive via priority order.
- Fund sample: 7,896 unique US hedge funds, 2006–2024; 89 were ever identified as AI (1.1%). That is the disclosed, observed HFR sample, not the entire market (p17/PDF19).
- Archived HFR snapshots for 2005–2024. Each fund-year uses the most recent strategy description and contract terms available at the prior year-end. Returns are kept starting with the first year appearing in a snapshot. This addresses look-ahead and backfill. Same-adviser share classes with ≥.99 return correlation are grouped to portfolio level (pp10–11/PDF12–13).
- Regression sample: USD-denominated US-domiciled funds, at least $5m AUM, nonmissing size, alpha, and contracts: 5,894 funds and 324,952 fund-month observations. Continuous variables winsorized at1st/99th percentiles (p11/PDF13).
- Monthly alpha: factor loadings fitted over preceding24 months, requiring at least12 returns. Current excess return minus current factor returns times past-estimated betas. FH seven hedge-fund factors and AQR multi-asset market/style factors. Alpha here is return unexplained by selected benchmark, explicitly NOT necessarily mispricing or anomaly (footnote13,p11).
- Performance regression controls quant status, contractual terms, size, age; strategy×month fixed effects. SE clustered by adviser and year-month. Sibling-fund specification adds adviser×month fixed effects (pp21–24).
- Observational comparisons and controls do not establish a randomized causal effect of AI, compute diffusion, or market competition. “Consistent with competitive adaptation” is supportable; “proves compute diffusion caused decay” is not.

## Other blurb claims: accurate values and corrections

1. **Autonomous versus all AI.** User opening conflates categories. The49.6bp pre2018 result is autonomous+augmented combined. Autonomous alone: +74.1bp pre2018, +0.2bp post2017, FH; augmented +11.2 and −27.9. Autonomous early result significant; neither autonomous later nor augmented early/later significant at5%. TableIA.5, appendix p27/PDF79. AQR autonomous pre+79.7, post−6.2bp.
2. **Early adopters.** Table6, printedp46/PDF48: FH pre+49.7bp(SE16), post+7.6(SE25.7); AQR pre+48.6(SE22.3), post−43.8(SE21.9), the last significantly NEGATIVE at5%. Late adopters after2017 FH−13.2, AQR+9.5, neither significant. Supports decline not solely weak new entrants.
3. **Siblings.** Table7, printedp47/PDF49: AI vs same-adviser sibling full-period FH+34.9bp(SE14.8), AQR+41.1(SE20.2), both p<.05. Year interactions−6.1bp and−7.8bp. This reduces adviser-level confounding; it does not prove “the algorithm itself” is the only causal contributor.
4. **Comovement.** Table8, printedp48/PDF50: within same HFR category, minimum12 overlapping monthly alpha observations. FH AI pairs .021 vs non-AI .124; excluding siblings .004 vs .123. AQR .077 vs .110; excluding siblings .058 vs .109. Peer-performance interaction values range−.123 to−.144 (the blurb's−.124 to−.144 misses−.123 but immaterial). Low unconditional monthly pair correlations weigh against a simple uniform-strategy account. They cannot rule out intraday crowding, shared tail exposure, synchronous liquidation under stress, or systemic contagion. The claim “very clear disproof of crash risk” overstates the test.
5. **Adoption.** About1,550 advisers disclose quantitative strategies in2024; around100 explicitly autonomous/augmented AI. AI mentions fewer than10 in2012 to nearly300 in2024; recent jump mainly support/theme/risk categories (p14/PDF16 and Figure1). These are disclosed classifications, not a census of actual model use.
6. **AUM.** AI HFR sample funds peak count share around2.7% in2023, roughly$12bn AUM in2024 (pp17–18/PDF19–20; Figure3). Avoid “only$12bn is traded with AI globally”.
7. **Macro concentration.** Intro states60% of2024 AI fund count systematic diversified macro(p2/PDF4). Figure4 and text pp18–19 use each fund at last available observation: >80% observed AI AUM in Macro, while within Macro roughly70% AI count and>90% AI AUM are Systematic Diversified Macro. Do not merge these into “>80% of2024 AI assets in systematic diversified macro” unless verified from underlying data. The lower-friction explanation is plausible/practitioner-supported, not experimentally established.
8. **Contracts.** Table4, printedp43/PDF45: incentive fee18.467% vs16.017%; hurdle3.4% vs12.5%; lockup2.121 vs4.990mo; restriction1.750 vs4.150mo. Table definition calls restriction the time to return money to a withdrawing investor, so “redemption notice period” is not exact.
9. **Flows.** Table9, printedp49/PDF51: performance coefficient .345; AI coefficient becomes−.064(SE.241) after controlling for performance, not significant. Label alone not associated with incremental observed flows. This does not prove all investors never respond to hype. Internal wording inconsistency: prose p26 says prior12-month average alpha; table caption says cumulative alpha. Avoid building a new flow chart that assumes one precise annualization without clarifying with authors.
10. **Exit.** Table10, printedp50/PDF52: one-year LIQUIDATION rates12.923% vs8.710%; total database dropout including stopped reporting19.625% vs15.397%. Differences all insignificant at10%. Do not call12.9/8.7 total dropout rates.
11. **Value added.** Paper p23/PDF25 calculates average monthly net dollar value added over each fund's lifetime, not simply total cumulative wealth creation. AI/non-AI difference not significant. Do not claim universal competitive equilibrium is proved.

## Explicit limitations and Backer implications

Authors pp27–28/PDF29–30: classification captures disclosed AI; undisclosed AI creates false negatives and could attenuate estimates. Labor matches have weak coverage of small specialized advisers. HFR covers a modest portion of FormADV assets;89 identified AI funds are few. AI technologies evolve rapidly, so future extrapolation warrants caution. Historical fund disclosure data cannot establish that today's frontier models or retail AI assistants are unprofitable.

**Defensible thesis:** “As analytical tools become more widely available, a research edge may depend on information that standard models do not observe. Backer is investigating whether behavioral history improves forecasts of how participants respond to new events—conditional on fundamentals, market state, and AI assistance.” This is an incremental-information hypothesis, not a verified alpha product.

**Do not say:** all hedge funds lost their edge; AI is omniscient/always correct/rational; every trade is still manually executed; past alpha came only from company facts; Backer+Jev automatically produces alpha; correlations prove no crash risk; this monthly paper validates HFT.

Behavior and order-flow analysis are established fields. Lillo & Farmer, *The long memory of the efficient market* (2004), show past order signs predict future signs, while compensating liquidity/size effects help preserve price efficiency. Primary paper: https://arxiv.org/abs/cond-mat/0311053 . Thus **predicting behavior is not sufficient to generate tradable alpha**. Backer's distinctive prospective contribution must be specified: new lawful/consented data coverage, participant conditioning, event counterfactuals, inference/cost advantage, and demonstrated out-of-time incremental performance over existing order-flow baselines.

**HFT scope:** SEC original concept release describes HFT's fast programs, co-location/direct feeds, short holding periods and order cancellations (printedp45): https://www.sec.gov/rules/concept/2010/34-61358.pdf . A research simulation or cloud choice API should be positioned as a context/signal research layer for trading systems. Support for a microsecond/millisecond execution path requires measured end-to-end latency, throughput, stale-input handling, deployment topology, and deterministic execution/risk controls; the monthly fund paper supplies none.

## Recommended empirical gates (our analysis, not paper findings)

1. Timestamped event and behavior data, lawful access, point-in-time snapshots, participant histories available BEFORE event; separate user cohorts and date/time splits. Holdings/cost basis/horizon/constraints help explain an action but must actually be observed rather than invented.
2. Predefine discrete actions and horizon. For example buy/hold/reduce/exit, conditioned on event, prior holdings and market context. Forecast distributions calibrated against real subsequent behavior; a forced choice or generated label is not calibrated confidence.
3. Compare public-information-only, prices/volume/order-flow, simple participant-history, AI-only and full Backer+Jev models. Participant and event holdouts; regime/stress strata; ablations; fixed evaluation harness across model upgrades.
4. Score behavior with log loss/Brier/calibration and trading with realistic fees, spread, fill probability, latency, impact, turnover and capacity. Probability lift alone does not prove P&L.
5. Shadow/paper evaluation, then bounded live validation only when separately authorized. Measure drift and decay; retraining/model upgrades must be revalidated and versioned. No “future model improvement guarantees durable edge”.

## Tool availability note

Read agent-reach skill and its search/web reference; mcporter/agent-reach CLIs unavailable in this shell. Used web search fallback and direct original NBER PDF via curl. Jina request was attempted. Read PDF skill; extracted with pypdf and rendered with pypdfium2. No source data/result reproduced from invented inputs.
