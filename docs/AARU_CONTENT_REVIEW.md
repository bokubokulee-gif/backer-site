# Aaru content and interaction-intent review

Reviewed 20 September 2026 against all six requested public pages. This pass covers the public text, expanded explanatory text present in the server response, and semantic controls in the delivered HTML. The parent task owns rendered desktop/mobile inspection and actual click verification. A declared button or tab is evidence of intended interaction, not evidence that the interaction was exercised successfully.

The five use-case pages were each retrieved in full, rather than inferred from their shared template. Their audience accordion descriptions were available in the initial response. Their question-next controls and scenario/simulation/results tabs were also present, but alternative tab contents were not exposed in the retrieved text. Public JavaScript asset requests returned HTTP 403; no attempt was made to bypass this. Browser inspection must close those specific content gaps before claiming every state was reviewed.

The local comparison is a source snapshot taken while Backer's implementation was still in progress: `simulation.html` and `js/simulation-model.js`. An absent or unfinished integration script is not scored as a completed-product defect.

## 1. Product Innovation

Source: [Aaru Product Innovation](https://aaru.com/use-cases/product-innovation).

- **Objective:** choose what to build through competing concepts, configuration, price, and adoption tradeoffs.
- **Audiences:** current/power users; dissatisfied/lapsed users; competing-product users; prospective or underserved users. The absence of a person from the existing customer base is itself relevant to opportunity sizing.
- **Question logic:** compare categories, narrow to a concept, then test the winning configuration and commercialization choices against the same population.
- **Illustrative case:** a home-appliance company chooses among an oven, floor cleaner, and outdoor cooker. Seven buyer audiences inform a category choice, product specification, entry price, premium tier, and launch route.
- **Distinct mechanism:** a concept can attract interest while failing a specific usage or switching constraint. The case connects an initial choice to several dependent decisions.
- **Interaction intent:** audience accordions, progressing questions, and three case views distinguish setup, simulation design, and resulting recommendations.
- **Backer implication:** show a concrete target offer and incumbent, one fixed objective, and explicit assumptions about trial. Backer's current action share cannot also stand for long-term retention or willingness to pay.

## 2. Marketing & Brand

Source: [Aaru Marketing & Brand](https://aaru.com/use-cases/marketing-brand).

- **Objective:** choose messaging, creative, offer, and delivery before committing campaign resources.
- **Audiences:** loyal customers, prospective category buyers, competitor customers, and lapsed or underserved groups.
- **Question logic:** distinguish attention, recognition of the brand, preference, next purchase, and adverse response. Optimize acquisition while checking effects on existing customers.
- **Illustrative case:** a burger chain compares three creative territories across six audience models, then narrows to taglines and film concepts. The central tension is attracting younger families without alienating an older customer base.
- **Distinct mechanism:** a campaign has multiple outcomes that can disagree; an overall favorable score can conceal a commercially important subgroup failure.
- **Interaction intent:** the common objective/audience/question exploration leads to a case with separate scenario, simulation, and results views.
- **Backer implication:** keep attention and target choice separate, then show cohort differences. Do not label the present utility-based choice output as brand recall, purchase lift, or measured backfire risk.

## 3. Audience Segmentation

Source: [Aaru Audience Segmentation](https://aaru.com/use-cases/audience-segmentation).

- **Objective:** define groups whose differing constraints and responses inform a commercial decision.
- **Audiences:** usage-based customer groups, category buyers/non-buyers, brand switchers, and emerging or underserved populations.
- **Question logic:** ask which people make the purchase, which use the product, how their needs differ, and where each group can be reached.
- **Illustrative case:** a children's brand considers expanding from infant/toddler products to older children. Five purchaser segments are separated from the end users; naming, product, price, and channels are tested alongside risk to the established franchise.
- **Distinct mechanism:** the buyer and beneficiary can be different actors. A single demographic profile can erase the decision relationship between them.
- **Interaction intent:** audience explanations and successive questions precede the scenario/simulation/results case views.
- **Backer implication:** do not present three predefined cohorts as discovered segmentation. Name them assumed behavioral groups and expose their weights, resource constraints, and target-response differences.

## 4. Scenario Planning

Source: [Aaru Scenario Planning](https://aaru.com/use-cases/scenario-planning).

- **Objective:** test whether a strategic decision survives different stakeholder responses and external conditions.
- **Audiences:** customers, employees/talent, institutional stakeholders, and competitors or other market participants.
- **Question logic:** connect an initiating event to reactions, subsequent reactions, and the signals that would justify changing the plan.
- **Illustrative case:** an equipment manufacturer evaluates recurring resilience services. Customer demand is tested alongside direct-versus-dealer distribution, dealer incentives, competitor response, and rollout order.
- **Distinct mechanism:** other participants adapt; a strategy's outcome depends on responses that the initiating organization does not control.
- **Interaction intent:** conditions and audiences organize the case before the simulation and result views.
- **Backer implication:** the present model includes attention feedback and an assumed competitive response; it does not solve strategic equilibrium or generate adaptive competitor policies. Show the response assumption and compare parameter settings as stress tests.

## 5. Strategic Communications

Source: [Aaru Strategic Communications](https://aaru.com/use-cases/strategic-communications).

- **Objective:** choose announcement framing, messenger, channel, and release order across conflicting stakeholder interests.
- **Audiences:** employees, customers/partners/communities, journalists/analysts, and investors/institutions.
- **Question logic:** separate interpretation and credibility from likely subsequent action. Test the same underlying facts under different presentations.
- **Illustrative case:** a bank evaluates alternative descriptions of a branch consolidation across seven stakeholder audiences, then considers delivery and disclosure order. A reading that benefits one audience can damage another relationship.
- **Distinct mechanism:** informational content and interpretation differ. Message effectiveness depends on a recipient's expectations, incentives, and relationship to the sender.
- **Interaction intent:** the case moves through scenario, simulation, and results, following the same expandable audience and question sequence structure.
- **Backer implication:** current credibility is an assumed cohort trait, not semantic analysis of a supplied announcement. Use a named hypothetical scenario with preset assumptions; do not imply that free text has been interpreted by the numerical model.

## 6. Simulation: the full method and product-output chain

Source: [Aaru Simulation](https://aaru.com/simulation); also cross-checked against the extensive source excerpt supplied by the user. These are descriptions of Aaru's presentation and self-reported methods, not independent validation or Backer capabilities.

### Definition and traceability

The public demonstration carries one store-brand decision through configuration, audiences, questions, and artifacts. The configuration contains objectives, attached-material names, status, and a persistent project identity. Audience definitions include behavioral and numeric constraints. Questions combine answer selection, matrices, price choices, free response, and exposure/decision criteria. This establishes continuity: the report is visibly generated for the decision introduced earlier.

The useful interaction principle is **define → inspect → compare → trace**. The product chrome is serving that continuity. Recreating a sidebar without the linked objective, question, and result would copy the appearance while losing the function.

### Expanded scientific explanations

| Module | Explanation exposed in public text | Control intent | Transfer to Backer |
|---|---|---|---|
| Data layers | Population baseline, recent behavior, and decision-specific customer information play different roles; resolution, cadence, coverage, and bias remain visible | Layer selectors; source-family menu; source choices; detail panel | Show what a source can support, when it was observed, and what the demo merely assumes |
| Joint population structure | Matching one-dimensional totals does not guarantee correct combinations; higher-order structure can change who occupies a subgroup | Dependency depth; profile explorer; trait-count/depth calculator | Demonstrate a dependency with a consequence, rather than adding more branches for visual complexity |
| Interaction complexity | Candidate trait combinations grow combinatorially; retaining every possible relationship adds noise and burden | Trait count and interaction depth change displayed candidate/cell counts | If included, compute the count exactly and explain it is possible complexity, not evidence of a learned Backer network |
| Two training resolutions | Individual response differences and population distributions constrain different forms of error; historical fit still requires held-out testing | Training-progress slider paired with population bars and removable trait contributions | Use a clearly labeled teaching instrument; current Backer has no training process to expose |
| Evaluation versus validation | A measured score must be interpreted against the population, intervention, assumptions, and intended decision; internal tests and engagement-specific checks answer different questions | Expandable explanations and case-study access | Separate quantitative error from a decision's tolerance and evidence requirements |

The source's income illustration is informative because a median can fall where few people are located. Its profile example shows why pairwise agreement can miss a three-way pattern. Its training comparison makes two errors visible at once. Each graphic answers a named inferential problem; animation is secondary.

The source also distinguishes modeled population response from an assertion about a named person's next act. Backer should retain that separation when describing synthetic cohorts and outcome distributions.

### Product output views

The report navigation is organized by summary and question. Audience cross-tabs sit beneath overall results. Four presentation choices—platform, spreadsheet, deck, and PDF—communicate that the same analysis can become a decision artifact. The HTML includes export controls and sample artifact buttons; successful downloads were not verified in this content pass.

Backer's smallest credible equivalent is a synchronized chart/table view plus a working CSV export. A result should identify the case, question, audience, parameter set, day, and baseline. Additional export types should only appear when the corresponding output is implemented.

### Remaining browser checks

The following were confirmed as declared controls, but require rendered interaction inspection by the parent:

1. The next-question control on each of the five use-case pages: record whether its content changes and how selection/progression is represented.
2. The scenario/simulation/results switch on every use-case page: inspect the two non-default states and any result figures or recommendation hierarchy.
3. The simulation page's source-family selector, non-public data layers, and expanded dataset details.
4. Every dependency-depth setting and at least two trait-count settings; inspect both diagram and explanatory copy changes.
5. Training slider endpoints and intermediate state; remove a trait and inspect both relevant graphs.
6. Report question navigation, four output views, and export menu. Do not infer actual files from the displayed filenames.

## Practical gaps in the current Backer source

### Priority 1 — Match interface wording to the actual model

- `simulation.html:67` says prior **choices** change later exposure. The model at `js/simulation-model.js:165–168` propagates prior **attention**. Use: “How strongly attention in connected cohorts reinforces the next exposure.”
- Display the baseline's 40/35/40 controls beside the alternative, not only inside a long assumption disclosure. The comparison is otherwise difficult to reconstruct.
- Label action percentages as shares of the synthetic population and attention percentages as shares of the attention budget. Those denominators cannot be used interchangeably in a funnel.
- In market mode, the persistent explanatory sentence beneath choices should refer to buy/hold/sell. Hold is an explicit action category, and the model assumes existing holdings for sell eligibility.

### Priority 2 — Give each use case a concrete decision dossier

The numerical model already varies use-case coefficients; the implementation is not merely a text switch. What is still thin is the decision specification around those calculations. The current page offers one question and the same three cohorts within a context, with no named offer/message, target-versus-incumbent comparison, or case-specific operational constraint.

Add a compact dossier above the console with four fields: **decision**, **audience**, **comparison**, **observed outcome needed**. This does not require extra model claims. Suggested original Backer examples:

| Use case | Concrete hypothetical decision | What this existing model can show | Additional evidence required |
|---|---|---|---|
| Product | Introduce a creator-research subscription beside an established workflow | Assumption-driven consideration and adoption differences | Actual trial and repeat-use records |
| Marketing | Increase distribution of a new product message | Attention/action separation and cohort response | Randomized exposure plus downstream conversion |
| Segmentation | Compare enthusiasts, evaluators, and established users | Weighted heterogeneity across predefined profiles | Evidence that groups are stable and predictive |
| Scenario | Stress-test a launch when a competitor becomes more visible | Conditional trajectories under different signal and friction settings | Dated historical or prospective outcomes |
| Communications | Announce a subscription change to different relationship groups | Consequences of assumed credibility and friction | Real comprehension, trust, and action measurements |

These are proposed examples, not completed Backer engagements. Do not imply the engine understands uploaded offers or announcements.

### Priority 3 — Trace distinct questions to existing outputs

`simulation.html:64–80` labels a single Q1, then mixes attention, target action, resource allocation, trajectories, and all choices. Add three inspectable questions, each selecting an already computed view:

- **Q1: Where does attention move?** Target/competing/elsewhere attention distribution and trajectory.
- **Q2: Which cohorts consider the target?** Cohort consideration and target-choice comparison.
- **Q3: What resource share follows?** Target action and fixed-budget allocation, with no-action/hold visible.

This provides real traceability without fabricated generated research. It also creates a natural table view and makes the difference between question and metric explicit. All views should use the selected day; final-only aggregate data must be labeled Day 30.

### Priority 4 — Make population assumptions inspectable

The model stores correlated trait bundles internally and currently exposes only cohort weights and outcomes. The dependency tree explains a concept but is not evidence that the three cohorts were fitted to population data.

Add an assumed-profile inspection panel for the selected cohort: relevance, credibility, friction sensitivity, inertia, peer response, resource capacity, and memory. Show normalized illustrative values or plain-language levels. For a deeper teaching panel, compare two constructed populations with matching marginal totals but different joint assignments, then show the difference in a single outcome. Keep this separate from empirical validation.

### Priority 5 — Distinguish illustrative mechanics from evidence

The source includes a useful TVD teaching instrument, proposed validation label, holdout principles, and source-versioned reading list. Preserve these. Two additions would improve decision relevance:

- Identify what future observation would contradict the scenario's mechanism, such as rising attention with no change in consideration after controlled exposure.
- Show a compact protocol record: target population, horizon, outcome definition, split unit, baseline, and decision threshold. Thresholds are proposed study choices, not inherited competitor benchmarks.

The claim that a source has a particular grain or coverage is stronger when the reader can inspect a real source citation and its scope. The evidence-layer illustration should distinguish a research reference from an input actually used by the browser model. It currently uses no live data.

### Priority 6 — Provide an output that survives the page

CSV is appropriate for the present implementation. Include context, use case, exact question, model version, cohort assumptions, fixed baseline inputs, alternative inputs, and all day rows. If a chart/table toggle is added, the table should use the same underlying data. Do not add inactive spreadsheet/deck/PDF controls solely to mirror another product.

## Review conclusion

The main opportunity is to make each Backer use case a specific, inspectable decision with a traceable result. Additional technical vocabulary would not solve that gap. The existing finite-attention model, cohort heterogeneity, conditional choices, and explicit evidence boundary provide a sound educational foundation; the next layer is structured context and tighter correspondence between questions, calculations, and artifacts.

All Aaru capabilities, scale claims, speed claims, customer examples, and validation figures remain Aaru-authored statements. None should be presented as Backer's data, training, customers, or performance.
