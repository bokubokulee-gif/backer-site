# Aaru use-case mobile and visual review

Inspected 2026-09-20. This supplements `AARU_USECASE_VISUAL_REVIEW.md`, which owns the desktop review. The review used a separate headless Chromium session at **390 × 844 CSS pixels**, touch/mobile emulation, device scale factor 1. No user Chrome or in-app tabs were opened. No forms were submitted. This is browser emulation, not physical-device testing.

## Evidence coverage

All five supplied use-case paths were loaded and rendered:

- [Product Innovation](https://aaru.com/use-cases/product-innovation)
- [Marketing & Brand](https://aaru.com/use-cases/marketing-brand)
- [Audience Segmentation](https://aaru.com/use-cases/audience-segmentation)
- [Scenario Planning](https://aaru.com/use-cases/scenario-planning)
- [Strategic Communications](https://aaru.com/use-cases/strategic-communications)

For each page, captured the hero, objectives section, audience demonstration, three sampled question states, Scenario, Simulation, Results, lower result, and lower call-to-action. Then exercised the first expandable Simulation objective, selected its Audiences and Questions sections and expanded the first row, and selected the final result finding. Those rendered states were inspected, including the charts and their interpretations. The first and final result findings are covered by this mobile review; the companion desktop review covers the remaining findings.

There are **95 mobile screenshots** in `/tmp/backer-aaru-review/usecases/`, plus per-page `*-mobile-initial.json`, `*-mobile-states.json`, and `*-mobile-detail.json` interaction logs. The screenshot naming pattern is `{page-slug}-mobile-{state}.png`. These are private reference evidence and must not be copied into public Backer assets.

All five pages measured `document.scrollWidth = innerWidth = 390` at the initial and final sampled states. No global horizontal overflow was observed. Individual charts remain inside their cards, though some labels are very small.

## Shared visual and interaction structure

The desktop heroes were independently inspected at 1440 × 1000. They use a restrained three-part composition: a short thesis on the left, a large animated point/diagonal-line object in the middle, and a mechanism paragraph on the right. Each use case has a different recognizable form. On mobile this becomes category → thesis → object → supporting paragraph. The header becomes a logo at the left edge and a menu icon at the right.

The mobile hero preserves a large empty gap above the thesis. The first paragraph begins around the bottom of the first viewport, so the user must scroll before reaching substantive demo controls. For Backer, retain the deliberate spacing and symbolic identity but bring the first interactive affordance closer to the first fold.

Objectives, Audiences, and Questions are presented as separate explanations paired with large rounded visual tiles. The tiles use defocused context photography with dark translucent overlays. Audience options become rounded expandable rows; questions become a physical-looking stack with a Q-number badge, answer-type pill, and a small next arrow at bottom right. Multiple-choice options are shown as a schematic preview rather than an ordinary editable form.

These upper demonstrations animate automatically as well as responding to interaction. A click on the second audience row produced a transitional second-row explanation, but its sampled `aria-expanded` state subsequently returned false. Sampled question cards also advanced during the capture interval, so a recorded next-arrow click cannot be treated as a stable one-step increment. Backer should pause automatic progression after direct user input and expose explicit selected state. Do not copy timing-dependent state changes into a scientific demo.

The lower case study is a distinct, calmer dark panel. Scenario / Simulation / Results is a compact segmented control, with the selected pill visibly lighter and `aria-checked` confirmed after each primary selection. The content is organized around one business decision rather than a list of general capabilities.

Inside Simulation, Objectives / Audiences / Questions becomes **three stacked navigation rows** on mobile, each with a count. Below them, expandable rows reveal method detail. Audience rows include segment shares and a small segmented bar; question rows include question identifiers, response type, and the reason for asking the question. This is the layer that makes the product feel inspectable.

Inside Results, a numbered findings list appears above the active chart. Selection changes the explanatory headline, chart, and interpretation as one unit. A bright green accent marks the selected finding and meaningful series; neutral series remain gray. The varied chart forms are essential to the explanation.

## Per-page observations

| Page | Visual identity and decision | Mobile simulation detail | Results visually inspected |
| --- | --- | --- | --- |
| Product Innovation | Teapot-like product form; a home-appliance portfolio choice with category, specification, price, and launch decisions. | Four objective stages. Audience rows carry market shares. Question cards include category choice, purchase likelihood, trade-offs, willingness to pay, and channel discovery. | First finding: audience × category heatmap, with the leading cells highlighted. Final finding: stacked willingness-to-pay bands contrasting the whole market and a connected-home segment. Both end with a decision implication. |
| Marketing & Brand | Target/rings motif; selecting a creative territory while protecting existing customers. | Four objective stages move from brand permission through message and creative testing. Audience shares distinguish growth, loyal, lapsed, and skeptical groups. | First finding: grouped horizontal bars compare three territories across priority audiences. Final finding: horizontal bars contrast missing product proof with low visit intent. This separates attention/appeal from a downstream response. |
| Audience Segmentation | Separated point clusters; a children's brand extension where the purchaser and user can want different things. | Five objective stages include buyer/user separation and under-sampled groups. Expanded question explains why perceived age fit is measured before testing the extension. | First finding: naming preference heatmap by audience. Final finding: stacked response bars for existing customer groups, followed by an explicit interpretation limit: concept perception differs from post-launch behavior. |
| Scenario Planning | A branching tree; a manufacturer deciding whether and how to enter recurring services. | Four stages cover demand/pricing, channel conflict, competitive response, and sequence. Questions connect willingness to pay to operational downtime and dealer incentives. | First finding: multiple price-response curves show that one cohort is less price-sensitive. Final finding: stacked adoption-timing bars compare dealer types and support a staged route to market. |
| Strategic Communications | Megaphone form; a bank restructuring announcement interpreted by stakeholders with different incentives. | Four stages cover message, regulator, workforce, and sequencing. Expanded audience and question rows include longer methodological explanations and follow-up prompts. | First finding: dumbbell comparison separates two interpretations across stakeholder groups. Final finding: horizontal bars show loss of trust when others hear the news first. The output addresses sequence and channel, not only wording. |

All numerical scenarios above belong to Aaru's explicitly illustrative product demonstrations. They are not Backer results, independently verified validation, or reusable benchmarks.

## Specific mobile lessons for Backer

1. **Keep the decision visible.** Each use case should state the choice, the alternatives, the affected populations, and the outcome being compared before showing an elaborate scene.
2. **Use a layered inspection model.** A simple first view should open into objectives, audience construction, questions, and findings. Each layer should answer a distinct user question.
3. **Connect every finding to a measurement.** Place the question, response distribution, uncertainty or evidence status, and practical interpretation together. Avoid an attractive chart that has no defined unit or provenance.
4. **Choose the chart from the relationship.** For Backer: exposure-to-action Sankey/tree; cohort × stimulus heatmap; retention/attention decay curves; paired counterfactual outcome bars; price/attention sensitivity curves; uncertainty bands. Do not use the same chart everywhere.
5. **Keep images conceptual and charts real.** The generated Backer plates can explain architecture and host meaningful hotspots. Numerical plots, controls, tooltips, and legends should remain live HTML/SVG, with explicit illustrative status where appropriate.
6. **Make mobile selection stable.** Stack config navigation above the selected panel; maintain the user's choice while scrolling; keep a compact context label near the chart. Pause any automatic tour after a tap, click, or keyboard interaction.
7. **Improve legibility beyond the reference.** Several Aaru chart labels are tiny or low contrast, long audience titles truncate, and the transparent fixed header overlaps content in scroll captures. Backer should use an opaque or backed header, scroll offsets, wrapping labels, readable legends, and adequate tap targets.
8. **Preserve semantic distinctions.** Attention, recall, preference, purchase, adoption, retention, and capital allocation are different endpoints. Backer's page should show their conditional relationship and uncertainty instead of implying that attention mechanically guarantees a transaction.

## Representative local evidence

- `product-innovation-mobile-simulation-questions-lower.png`: inspectable question list and answer-type metadata.
- `product-innovation-mobile-results-lower.png`: cohort comparison heatmap and interpretation.
- `marketing-brand-mobile-result-final-lower.png`: outcome-specific bar chart and decision implication.
- `audience-segmentation-mobile-result-final-lower.png`: concept-test limitation attached to output.
- `scenario-planning-mobile-results-lower.png`: cohort price-response curves.
- `strategic-communications-mobile-simulation-questions-lower.png`: methodological rationale and follow-up prompts.
- `strategic-communications-mobile-result-final-lower.png`: announcement-order effect chart.

All filenames above resolve under `/tmp/backer-aaru-review/usecases/`. The capture scripts are `mobile-audit.cjs`, `mobile-states.cjs`, and `mobile-detail.cjs`; each ran in a separate headless Chromium context and closed its browser on completion.
