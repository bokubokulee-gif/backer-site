# Scientific correctness review

20 September 2026. Scope: source review of `simulation.html`, `js/simulation-model.js`, `js/simulation-cases.js`, new preview notes in `research-lab/assets/research-notes-20260920.js`, and the affected preview wrappers/method copy. This is not rendered-browser acceptance. The main interaction controller was still being implemented during the pass; its generated captions and exports need the same checks below.

## Assessment

The main demo correctly distinguishes an assumed scenario model from an empirical forecast. Its cohort weights, finite attention allocation, consideration gate, choice probabilities, and capacity-weighted budget allocation are coherent. No fitted population, measured Backer forecast accuracy, or competitor performance is claimed as a Backer result. The five reading references are correctly attributed.

Several equation and terminology issues were corrected in the HTML. Further legacy preview strings were reported to the parent, which began correcting them during this review. The exact file versions should be rechecked after integration.

## Corrections made in simulation.html

1. **Determinism in the headline explanation:** changed “determine” to “shape” when describing beliefs and constraints. The model outputs a distribution, and the prose should not imply perfect determination of individual acts.
2. **Softmax:** removed a displayed temperature parameter that the implementation does not vary. The code uses a fixed scale; the caption now says so.
3. **Consideration timing:** the displayed recurrence now uses current-step attention and prior-step consideration, matching `simulate()`. Its learning weight is one minus the stored retention coefficient, and the saturation function is stated explicitly.
4. **Conditional choice:** clarified that the target utility probability applies when the target is considered. Competing choice and no action remain available when it is not. This describes the actual mixture in `choicesFor()`.
5. **Percentage points:** inserted the factor of 100 when normalized choice probabilities are converted into a displayed scenario difference.
6. **Resource weighting:** explained that budget allocation additionally weights target probabilities by assumed cohort resource capacity. It is not interchangeable with the population choice share.
7. **Time-series denominator:** clarified that each day shows a choice distribution, not cumulative unique adopters or transactions. The code neither tracks unique conversions nor depletes budgets across days.
8. **Population tree:** explicitly identified the tree as a teaching diagram. The model has three authored trait bundles; it does not fit or sample a learned population network.
9. **Market scope:** stated that the demo does not update holdings, prices, or liquidity. Buy/hold/sell shares do not establish net capital inflow or returns.
10. **Source class:** described Simile's confidence piece as a company technical article, avoiding an implication of independent peer review.

Only text/equation fragments were changed. No DOM IDs, structure, JavaScript, model coefficients, or controls were altered by this review.

## Quantities that must remain distinct

| Quantity | Actual definition | Interpretation to avoid |
|---|---|---|
| Attention | Cohort-weighted share of a finite modeled attention budget | Percentage of real people reached; measured views |
| Consideration | Cohort-weighted probability that the target enters the choice set | Observed recall; expressed purchase intent |
| Target action | Conditional target probability, mixed across cohorts | Cumulative adoption; executed trades; qualified purchases without a defined qualification endpoint |
| Outside action | No action in company/internet; hold in markets | Everything other than target choice; the competing choice is separate |
| Budget allocation | Target probabilities weighted by population weight and resource capacity, normalized to the fixed total budget | Real currency flows; cumulative spending; price impact |
| Scenario difference | Alternative minus baseline under assumed coefficients | An identified causal effect |
| Teaching TVD | Distance between constructed probability vectors | A Backer validation score or confidence estimate |

At each step, target action cannot exceed consideration. Choice shares and attention shares each sum to 100%, but they describe different distributions. The two scenario paths share the initial state; intervention sliders affect later steps. Friction acts on utility, while reinforcement propagates prior attention, not prior actions.

## Preview-note and legacy-renderer findings

### Corrected by the parent during this review; changes re-read

- **Endpoint mismatch:** the trading note now says event-probability forecasts are scored against resolved events. A market resolution does not score a price trajectory or validate a count of filled orders.
- **Exposure versus attention:** the note now proposes notice, recall, or dwell measured conditional on recorded exposure. Exposure itself is not evidence that attention occurred.
- **Conditional denominator:** the note's logistic decision-tree equation now starts with `P(choice | exposed)`, matching its denominator of 1,000 illustrative exposures.
- **Memory timing:** the note's recurrence now uses current-step exposure and previous-step memory, matching the plotted update convention.
- **Impossible coverage combination:** the trading fixture paired a claimed 90% interval of 821–917 with an example probability of 0.78 for exceeding 750. Any interval with 90% probability mass entirely above 750 requires that exceedance probability to be at least 0.90. The interval is now labeled an illustrative range, and the probability tooltip identifies it as authored and uncalibrated.
- **Hidden-service implication:** the legacy method script now describes a static declaration and authored examples rather than claiming a secure research runtime or executed off-browser model.
- **Causal driver language:** visible driver labels now say modeled stage rather than causal stage.

### Remaining verification items sent to the parent

- Review remaining `lab-public-v1.js` tooltips and scenario descriptions that call fixed constants “reviewed aggregate projections,” refer to a full research population outside the browser, or imply an executed model generated the snapshots. “Authored aggregate example” is the supported description of this renderer.
- The notes' explanatory calculators use their own deliberately small equations. A visible sentence that they illustrate mechanisms and do not generate the preview readouts would prevent mistaken attribution.
- `attention-simulation.html` embeds an externally hosted world. The note appropriately identifies fictional characters and simulated behavior, but external data freshness, character count, and runtime mechanisms were not independently re-established in this source-only pass. Parent browser review must support any retained specific claims.
- Keep final-cohort rows clearly labeled Day 30 when the main trajectory is scrubbed to an earlier day. A selected-day metric and a final-day comparison should not silently share one timestamp.
- All 15 case dossiers are fictional and mechanism-based. Their natural-language questions do not become inputs to a language model. Any mention of sustained use means a sequence of modeled participation shares, not validated individual retention.

## Reading-list verification

Primary records reopened on 20 September 2026; shorter display titles are acceptable reading-list labels.

| Displayed reference | Verified record and scope |
|---|---|
| Generative Agents | [Park et al., *Generative Agents: Interactive Simulacra of Human Behavior*](https://arxiv.org/abs/2304.03442), 2023; current arXiv version v2, 6 August 2023. Memory, reflection, planning, and believability are appropriate labels. It does not establish real-market forecast validity. |
| LLM Agents Grounded in Self-Reports | [Park et al., *LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals*](https://arxiv.org/abs/2411.10109v3), v3, 28 June 2026. The site correctly links this version and does not reuse the obsolete v1 85% headline. |
| Finetuning LLMs for Human Behavior Prediction | [Kolluri et al., *Finetuning LLMs for Human Behavior Prediction in Social Science Experiments*](https://aclanthology.org/2025.emnlp-main.1530/), EMNLP, November 2025. Distributional generalization is an appropriate topic label. No disputed abstract/table improvement percentage is reproduced. |
| Building confidence in Simile | [Andrew Wesel, Sarah Chen, and Percy Liang, *Building confidence in Simile*](https://www.simile.com/blog/confidence). Company-authored explanation of error prediction and confidence evaluation; not evidence that Backer has a trained confidence model. |
| All That Glitters | Barber and Odean, *All That Glitters: The Effect of Attention and News on the Buying Behavior of Individual and Institutional Investors*, *Review of Financial Studies*, 21(2), April 2008, 785–818. [Publisher issue record](https://academic.oup.com/rfs/issue/21/2); [linked author paper record](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1151595) was retrieved earlier in this task, although one subsequent request failed. The attention/investor-choice label is accurate; the study does not establish profitable returns from attention. |

The reading-list introduction correctly states that external results do not validate Backer's outputs. Preserve it.
