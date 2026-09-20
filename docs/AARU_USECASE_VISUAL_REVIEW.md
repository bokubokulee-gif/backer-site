# Aaru use-case desktop visual and interaction review

Reviewed 2026-09-20 in a separate, background headless Chromium browser at **1440 × 1000 CSS pixels**, scale factor 1. The user's Chrome and in-app browser were not used. This is an actual render review: screenshots were captured and opened for visual inspection after exercising the controls. It supplements the earlier text review in [AARU_CONTENT_REVIEW.md](AARU_CONTENT_REVIEW.md). The separate [mobile review](AARU_USECASE_MOBILE_REVIEW.md) covers 390 × 844 emulation. The main `/simulation` page is covered by the parent agent's separate review.

## Sources and inspected states

| Primary source | Desktop states inspected | Distinctive visual device |
| --- | --- | --- |
| [Product Innovation](https://aaru.com/use-cases/product-innovation) | Hero; objective preview; audience accordion; changed question card; Scenario, Simulation, Results; nested method sections and findings | Line-and-point cooking vessel; cohort/alternative heatmap, price response, and premium distributions |
| [Marketing & Brand](https://aaru.com/use-cases/marketing-brand) | Same primary and nested states | Target rings; grouped comparisons, attribution dumbbell, and barriers versus visit intent |
| [Audience Segmentation](https://aaru.com/use-cases/audience-segmentation) | Same primary and nested states | Separated clusters; audience/naming heatmap and differences between buyers and users |
| [Scenario Planning](https://aaru.com/use-cases/scenario-planning) | Same primary and nested states | Branching tree; cohort price-response curves and channel-response distributions |
| [Strategic Communications](https://aaru.com/use-cases/strategic-communications) | Same primary and nested states | Megaphone; interpretation dumbbells, stakeholder differences, and disclosure-order effects |

The lower tabs were clicked and their `aria-checked="true"` state recorded on every page. The Simulation panel contains a **second** navigation for Objectives, Audiences, and Questions. Its rows were opened individually; the first expanded row of each category was captured. Each numbered Results finding was selected and captured. These are not inferred from the initial HTML.

Evidence lives in `/tmp/backer-aaru-review/usecases/`. Files are named `{slug}-desktop-{state}.png`; `*-desktop-audit.json` records primary states, `*-nested-desktop.json` records the expanded lower sections and results. `desktop-audit.cjs` and `nested-desktop.cjs` are reproducible capture scripts. Screenshots are private research evidence, not assets to republish on Backer.

## Shared composition and interaction

The hero uses a restrained three-part layout: a small category and short decision thesis on the left, an animated monochrome object in the center, and a mechanism paragraph on the right. The final clause is brighter than the setup. A compact floating header sits above a large area of negative space. The objects have a common point/diagonal-line grammar but a different recognizable subject for each use case. This provides identity without adding a dashboard before the decision has been explained.

The next sequence pairs explanatory prose on the left with a large rounded visual tile on the right. The tile stays in place as the explanation advances through Objectives, Audiences, and Questions. Defocused imagery supplies context; translucent panels keep the interface in front. Objectives progressively reveal numbered cards. Audiences appear as four rounded expandable rows. Questions are stacked cards with a question identifier, response-format badge, schematic answer area, and a next arrow. The diagrammatic answer bars are not observed response percentages.

These upper previews **advance automatically**. A click can be followed by another animated state; a next-arrow click does not guarantee that the eventual captured card is exactly one numerical step later. Controls in an opacity-zero sibling remain in the DOM, so simple text extraction and even a visibility selector can mistake an inactive preview for the rendered one. The desktop audit used the active state, actual click coordinates, and screenshots to verify what appeared. Backer should retain direct selection and pause automatic progression after user input.

The lower case study is visually calmer. A small illustrative-status label and a concrete business decision introduce a dark rounded panel. Its three primary states have different jobs:

- **Scenario:** a short decision narrative, plus a compact right-side summary of alternatives, constraint, and required output.
- **Simulation:** a left rail with scope badges and Objectives / Audiences / Questions counts; the right side reveals expandable configuration detail. Audience rows expose a share and a segmented population bar. Question rows expose an ID, format, and reason for asking it.
- **Results:** a numbered left-side list of findings; selection changes the conclusion, plot, and interpretation together. The chart is chosen for the relationship being explained. The right-side plot has its own frame, labels, legend, and a statement of what the comparison means.

The strongest design lesson is the relationship between these states. The result is a consequence of a specified question asked of a specified population under a specified condition. The number of agents is only a scope badge; inspectable questions and interpretations do the explanatory work.

## What makes each use case distinct

### Product Innovation

The illustrative decision selects a category and then a product configuration for a home-appliance roadmap. The method follows commercial order: establish category demand; compare concepts; trade off features and price; determine introduction and distribution. Seven buyer groups make the aggregate result inspectable. Questions include forced category choice, purchase intent, alternative comparison, configuration tradeoffs, pricing, a connected-feature premium, and discovery/purchase channels.

Results begin with a **cohort × alternative heatmap**, including an outside option. A strong segment peak is then compared with overall demand using horizontal bars. A separate configuration comparison distinguishes a broad-market offer from premium cohorts. A price-response plot separates positive intent, undecided respondents, rejection, and premium-group response. The final stacked distributions show that a connected-feature premium is concentrated in one audience rather than universal. This is a sequence of related decisions, not five versions of the same KPI.

For Backer: keep attention, consideration, choice, and resource allocation as separate stages. A stimulus may gain attention in a small cohort without creating broad demand. Preserve the outside option. A price or feature experiment should only be called a price or feature experiment if the model actually represents that change; the current educational controls are exposure, peer reinforcement, and friction.

### Marketing & Brand

The illustrative burger-chain campaign compares three creative territories across six behavioral audiences. The method moves through brand permission, territory comparison, message testing, and creative testing. The questions distinguish relevance, appeal, visit intention, belonging, credibility, and correct brand attribution.

The first plot uses **grouped bars** to compare territories across priority audiences. The subsequent findings compare concrete value language with more abstract framing; separate preferred creative from the creative associated with stronger visit intent; use a **dumbbell chart** to contrast attribution to the advertiser and the category leader; and show that some lapsed or skeptical audiences need product evidence rather than more affective messaging. The result includes a countervailing audience instead of presenting one universal winner.

For Backer: gaining attention and changing action are separate observable endpoints. A downstream action chart is necessary beside the attention plot. The current model can demonstrate that conditional relationship, but it does not read a real advertisement or estimate a real brand-attribution effect.

### Audience Segmentation

The illustrative children's-brand extension distinguishes the purchaser from the child who uses the product. The method covers segment sizing, buyer/user separation, channel and geography, under-sampled groups, and the repositioning decision. Its six audience entries include a child end-user layer alongside purchaser groups; those roles should not be casually collapsed into one independent population.

The opening **naming-preference heatmap** shows that different groups favor different architectures. Later views separate decision drivers, premium purchasing, favorable concept appraisal from likely purchase, and whether the original franchise remains accepted. This turns segmentation into a set of different response functions, with different evidence required to move each group. The text attached to the final result explicitly limits concept perception as evidence of post-launch behavior.

For Backer: fixed synthetic cohorts should expose their weights, correlated traits, and different responses. Label them as assumed groups. Do not imply that three pedagogical cohorts were discovered by clustering proprietary people. Company, internet, and market contexts also need distinct actor roles and resource constraints.

### Scenario Planning

The illustrative manufacturer is considering a recurring energy-service offer. The method links customer demand and pricing to dealer incentives, competitive responses, and launch sequence. This is broader than varying a headline demand assumption. The question list contains explicit conditions and asks how stakeholders would respond under each one.

The first result uses **cohort price-response curves** to show that a smaller operationally sensitive group is less price-sensitive. Other findings inspect package preference, a software-led recapture opportunity, different competitive responses, and dealer adoption timing. The final result is a **stacked timing distribution**, supporting a rollout sequence rather than a single market-wide date.

For Backer: a scenario is a named change in conditions and a comparison to a held baseline. Show the parameter changes and time horizon. Peer reinforcement in the educational model is an assumed feedback mechanism; it is not a calibrated estimate of a competitor's response or a causal effect measured from an intervention.

### Strategic Communications

The illustrative bank announcement has several stakeholder groups with different incentives. The method shows alternative language verbatim, then investigates regulatory response, workforce response, channel, and disclosure order. The expanded rows are longer than on the other pages: they give the question, the reason for measuring it, and the decision it informs.

The first **dumbbell comparison** separates two interpretations across stakeholders; the same facts are read differently. Subsequent findings show that the framing preferred by market participants can cost workforce trust, that a different frame matters to digital talent, and that delivery channel and notification sequence must be chosen by audience. The final bar comparison concerns the loss of trust when people hear the news secondhand. Wording is not treated as sufficient to overcome the underlying event.

For Backer: make communications scenarios about an explicit audience and defined behavioral response. The current model can illustrate exposure, memory, friction, and choice. It cannot infer credibility from the semantic content of arbitrary real announcements, and its financial context must not be represented as a forecast of prices, liquidity, or market capitalization.

## Translation into Backer's design and scientific scope

Use Backer's existing palette, typography, robot, and visual identity. The transferable elements are the decision hierarchy, the relationship between prose and interaction, the audience/question provenance, and the selection of an appropriate plot—not Aaru's illustrations, photos, cases, numbers, or claims.

For the current implementation, the useful acceptance criteria are:

1. A chosen use case opens a concrete fictional decision, a population, observable questions, and a proposed validation target. The page should not only relabel the same generic slider card.
2. The controls genuinely change numerical results and make the held baseline, alternative settings, horizon, denominator, and units visible.
3. Every chart has a specific role: finite attention composition; attention-to-consideration lag; conditional choice; cohort differences; fixed-budget allocation. A technical equation and its visual should describe the same mechanism.
4. A result can be traced back to the question and assumptions that produced it. A preset question is not a claim to answer arbitrary free text.
5. Distinguish an educational mechanism from a trained or validated forecast at the point where numbers appear. Do not use decorative confidence bands, population counts, or smooth curves as evidence of measured accuracy.
6. Keep input state stable under scrolling, keyboard interaction, and animation. Use readable labels and deliberate scroll offsets; the reference's small gray chart labels and floating-header overlap are not behaviors to reproduce.
7. Preserve endpoint distinctions: attention share is not a count of unique people; a per-day action probability is not cumulative adoption; a fixed-budget share is not dollar inflow or asset-price appreciation.

All Aaru numbers, sample sizes, and scenario outcomes in the inspected interfaces are source-authored illustrations. The review is evidence of their public presentation and interaction design, not independent validation of their model or evidence about Backer's performance.
