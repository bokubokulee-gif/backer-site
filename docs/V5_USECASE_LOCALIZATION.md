# V5 use-case editorial and localization review

## Scope

All five product use cases now have complete Simplified Chinese, Japanese and Korean editions through `?lang=zh`, `?lang=ja` and `?lang=ko`. English is the default. The shared presentation runtime preserves language on internal links.

- Product Innovation: 产品创新 / 製品開発 / 제품 혁신
- Marketing & Brand: 营销与品牌 / マーケティング・ブランド / 마케팅·브랜드
- Audience Segmentation: 受众细分 / オーディエンス分析 / 오디언스 세분화
- Scenario Planning: 情景规划 / シナリオ分析 / 시나리오 계획
- Strategic Communications: 战略沟通 / 戦略コミュニケーション / 전략 커뮤니케이션

## Editorial decisions

Reviewed every heading, introduction, control, assumption, study objective, audience description, question, finding, interpretation, graph caption, legend, value inspector and evidence paragraph. Refined 70 unique English phrases across the five HTML pages and the shared controller. The prose now leads with the mechanism or decision, trims repeated “authored fixture” phrasing, and keeps the evidence boundary explicit where it matters.

Examples:

- “Attention brings a product into consideration. Workflow fit and the cost of the first session determine whether consideration becomes trial.”
- “Feature-led entry wins notice; guided entry wins trial choices. Because wording and support change together, their effects cannot be separated here.”
- “Every group shows a gap between agreement and buying. A belief is one input to a decision, not an order or a capital inflow.”
- “In every role, support exceeds commitment. The next question is who will take a concrete step.”

The localized editions express these arguments naturally. They preserve the difference between notice, recall, hypothetical choice, observed behavior and causal evidence. Brands, formulas, probabilities, numerical values and question IDs remain unchanged.

## Implementation

`js/locales/simulation-usecases.js` contains 583 exact messages and 43 dynamic templates, each with Chinese, Japanese and Korean values. This includes all 412 original static HTML and fixture strings, their revised English equivalents, and interactive scene captions, accessible labels, count readouts and state transitions. Lowercase sentence variants are explicit aliases.

The controller translates text and accessible SVG attributes at creation time, so animated redraws do not flash English. Compound chart descriptions localize their constituent labels before assembly. Heatmap headings wrap localized text instead of splitting the original English words. The shared runtime still handles static HTML, page titles, metadata, links and changed presentation nodes. No numeric values or simulation state depend on translated text.

## Verification

Headless Playwright, local source at port 4281:

- All five pages in each of `zh`, `ja`, `ko`: 15 page/language combinations.
- 390 px viewport, reduced motion, no JavaScript errors, no horizontal page overflow.
- All three product barriers, all marketing messages and funnel stages, both audience trait nodes and their connection, event injection, all nine stakeholder/message combinations.
- Every study-design tab and all 15 findings, including every row/time selection and original value tables.
- Static and dynamic text plus `aria-label`, `aria-valuetext`, `title` and `aria-roledescription` audited after interactions. The only fully English text remaining was the proper brand name “Backer”.
- Rendered scene and finding screenshots captured for each page and language. Chinese product and marketing, Japanese audience and Korean communications inspected directly. Separate design QA covers narrower 320 px and desktop layouts.

Evidence: `/tmp/backer-uc-v5/qa.json`, `/tmp/backer-uc-v5/missing.json`, `/tmp/backer-uc-v5/invariants.json`, and per-page screenshots in the same folder. Repeatable audit: `/tmp/uc-locale-qa-final.cjs`.

V4-to-V5 invariant comparison confirms all 15 numerical fixtures, chart types, scales, original series, condition labels, question IDs and population weights are unchanged. Invariant SHA-256: `9b163265c6fc473f2426c1d8946dd3db7ddaa68a8f92f78e33c4695f0f4c2dfc`.

The studies remain fictional, with assumed parameters and synthetic outcomes. Localization introduces no claims of model training, real participants, measured accuracy, causal identification or live prediction.
