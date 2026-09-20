# Research papers rewrite · 20 September 2026

Six authored, static articles replace the previous shared/empty method and thesis experience. Legacy article-rendering bundles are absent from the new papers. Each preview links directly to its own Method and Thesis; the old notes-modal triggers and script were removed from all three preview wrappers. The existing notes stylesheet remains because it supplies the world-preview header and layout.

| Preview | Method | Thesis | Working teaching figure |
|---|---|---|---|
| Trading behavior | `research-lab/method.html` | `research-lab/thesis.html` | A hypothetical event belief relative to fixed bid and ask quotes; acquisition and disposal arithmetic. |
| Human attention prediction | `research-lab/attention-method.html` | `research-lab/attention-thesis.html` | A four-step exposure pulse with adjustable retention and an explicitly unitless state. |
| Attention simulation | `research-lab/simulation-method.html` | `research-lab/simulation-thesis.html` | A 2×2 joint distribution: both margins fixed at 50%, adjustable overlap, unchanged total population. |

Shared files: `research-lab/assets/research-papers.css` and `research-lab/assets/research-papers.js`. The script only operates the three self-contained mathematical figures. It does not load a model, data feed, training process or external service. Methods have 728–795 visible words including captions and bibliography; theses have 649–694. All main prose is constrained to 65ch. Local Manrope and DM Mono assets accompany system serif headings.

## Scientific boundaries

- Trading distinguishes consideration, subjective probability, quotes, orders, fills and settlement. Proper probability scoring is separate from trade prediction and strategy profitability. The binary-contract figure is a fictional, risk-neutral, one-contract calculation before costs; selling assumes ownership.
- Attention declares observed time/event denominators, missing coverage, the information cutoff and future horizon. Memory is a candidate mechanism; neither the recurrence nor its coefficients is claimed as fitted. Simulation variability does not become calibrated uncertainty.
- Population simulation distinguishes a joint population distribution from its response mechanism. Paired model runs do not identify causal effects by themselves. Population fit, conditional response fit, aggregate distribution error and intervention effects require different evidence.
- The product-overview description matches the revised implementation: independent educational figures and authored use-case results. The town preview remains a fictional agent visualization. No Backer empirical accuracy or training claim is introduced.

## Primary sources verified

- [Kalshi order-book documentation](https://docs.kalshi.com/getting_started/orderbook_responses): bids, complementary asks, spread and depth; a midpoint is not an executable quote.
- [Kalshi settlement FAQ](https://help.kalshi.com/en/articles/13823821-market-faqs): contract-specific rules, official confirmation, distinct close/determination times and exceptional settlement provisions.
- [Calibration in Prediction Markets: Theory and Evidence](https://kalshi.com/research/publications/calibration), Kagan & Baiocchi, August 2026: exchange-authored observational research. Participation relationships are correlational and horizon/time anchoring matters. No numerical findings are attributed to Backer.
- [Kalshi and the Rise of Macro Markets](https://www.federalreserve.gov/econres/feds/files/2026010pap.pdf), Diercks, Katz & Wright, February 2026: risk-neutral versus physical probabilities and microstructure limitations.
- [Generative Agents](https://arxiv.org/abs/2304.03442v2), version 2: memory, reflection and planning; believability is not forecast validation.
- [LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals](https://arxiv.org/abs/2411.10109v3), version 3, 28 June 2026: current title/version; evidence has task and population boundaries.
- [Finetuning LLMs for Human Behavior Prediction in Social Science Experiments](https://aclanthology.org/2025.emnlp-main.1530/), EMNLP 2025: held-out experimental responses; no performance figures copied into Backer claims.
- [Building confidence in Simile](https://www.simile.com/blog/confidence): predicted error is a separate evaluated quantity from the simulated action distribution.
- [Gneiting & Raftery](https://doi.org/10.1198/016214506000001437) and [Barber & Odean](https://faculty.haas.berkeley.edu/odean/papers/Attention/All%20that%20Glitters.pdf) supply the proper-score and attention-selection foundations.

## Verification

An isolated headless Chromium session rendered all six papers at 1440×1000 and 390×844; screenshots were visually inspected, including all three method figures on mobile. There were no page errors or horizontal overflow at 390px. The joint-distribution article additionally passed 320px and 760px overflow checks. Mobile figures adjust chart typography and the joint figure's logical width.

All internal article navigation requests returned HTTP 200. The legacy trading `#validation` anchor remains; attention's evaluation section has `#evaluation`. The attention preview's old protocol links now target that section.

Interaction checks verified quote arithmetic at boundary inputs, retention-dependent decay, joint-cell normalization at 0/25/50 percent overlap, and the corresponding eligible-action output. JavaScript syntax passed Node's check. Local evidence: `/tmp/backer-paper-rewrite/qa.json` and `*-desktop.png`, `*-mobile.png`, `*-figure-mobile.png` in the same directory. This is local build verification, not publication evidence.

## V4 interaction brief · direct manipulation

Before implementation: replace the three exposed range bars with interaction on the scientific object. Article arguments and bibliography remain unchanged. All quantities remain hypothetical; no new empirical or forecasting claim is introduced.

- **Trading:** click or drag the belief marker on the probability domain. Arrow keys and explicit step buttons provide equivalent input. Select a bid or ask quote to inspect that transaction and adjust its fictional price by one cent; the spread and expected edge recompute, with bid ≤ ask enforced. Quote changes are counterfactual inputs, not market observations.
- **Attention:** click discrete timeline positions to add or remove exposure pulses, then play or step through accumulation and decay. Retention uses named numeric presets instead of a range bar. Changing the exposure sequence preserves the bounded recurrence and makes the resulting trajectory inspectable. Reduced motion uses an immediate complete result; time steps have no asserted real-world duration.
- **Joint population:** click a joint-distribution cell to move five percentage points into the selected relationship pattern. Concordant cells rise or fall together while discordant cells move oppositely, preserving both 50% margins and the 100% total. Visible cells and a population-mass illustration update together. Buttons and keyboard activation provide the same reassignment.

Verification will cover mouse/touch-style pointer input, native keyboard equivalents, endpoint constraints, formulas, fixed margins, playback state, reduced motion, and 320/390px rendering. Scroll animation is presentation only; each figure's primary control changes an assumption and its numerical result.

### V4 verification outcome

Implemented all three direct-manipulation figures. There are no `input[type=range]` elements in the method pages. Trading exposes marker drag/click, keyboard arrows/Home/End, one-point step buttons, and a quote inspector with one-cent counterfactual edits. Attention exposes an editable 20-step history, Play/Pause/Step, exact-step keyboard controls, and retention presets inside closed settings. Joint cells reassign mass in five-percentage-point increments, with disk area proportional to cell share and invariant margins.

Headless Chromium against source preview port 4281 passed mouse drag, plot click, touch tap, keyboard activation, bid/ask bounds, edge calculations, exposure recurrence, playback/pause/single-step, reduced-motion completion, empty-history behavior, joint-cell conservation and disk-area checks. All three figures were rendered and visually inspected at desktop, 320px and 390px; no horizontal overflow or page errors occurred. The belief marker uses accessible slider semantics on the object itself, with no range-bar UI. Article prose and source links outside the replaced figures remain intact.

Evidence: `/tmp/backer-paper-v4/qa.json`, plus `quote-desktop.png`, `memory-desktop.png`, `joint-desktop.png`, and the three method pages' `*-320.png` / `*-390.png` screenshots. Verification concerns this illustrative local implementation, not empirical Backer performance or a published release.
