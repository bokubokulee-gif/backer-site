# Backer pitch evidence + globe restoration PRD

Date: 2026-09-05  
Route: `pitch.html`  
Audience: investors, partners, and early market participants evaluating whether Backer's market thesis has credible inputs.

## Objective

Restore the evidence-rich market-validation sequence from the earlier pitch build and embed the main site's interactive creator-economy globe. The section must make the mechanism legible without claiming that market liquidity or product-market fit has already been proven.

## Narrative sequence

1. Show the causal analogy: attention gathers around events, capital prices uncertain outcomes, and Backer tests the same behavior around opted-in people and measurable creator milestones.
2. Restore quantitative proof that prediction-market participation is material and that creator attention already attracts economic spend.
3. Show that creator milestone contracts are already technically listable, while Backer's repeatable creator-supply and retention thesis remains to be tested.
4. Embed the main-site globe with its source-linked creator-economy scale figures.
5. End with an explicit evidence boundary: the data support the market inputs; a Backer pilot still has to prove two-sided demand, repeat participation, usable market quality, and clean resolution.

## Evidence requirements

- Use primary or authoritative source links adjacent to every restored figure.
- Prediction-market activity: Pew's May 2026 analysis reports combined monthly global notional taker volume on Kalshi and Polymarket International rising from less than $5B in September 2025 to about $24B in April 2026. Show only the two sourced endpoints; mark the first bar as an upper bound.
- Market concentration: Pew reports 91% / 90% of volume on Kalshi / Polymarket International in sports, politics, and cryptocurrency, using July 2024 through early May 2026 data.
- Creator contract precedent: Kalshi's August 2025 CFTC filing for YouTube subscriber milestone contracts.
- Creator demand context: IAB projects $37.1B in U.S. creator ad spend in 2025, up 26% year over year.
- Globe figures remain identical to the main site and retain their existing sources: Citi GPS ($60B 2022 creator-economy revenue), Goldman Sachs Research ($250B to $480B 2023-to-2027 projection), and Visa (~207M creators, citing Linktree).

## Product and claim boundaries

- Do not say the data prove Backer will be liquid, retain traders, or produce investment returns.
- Define notional taker volume and distinguish it from deposits, revenue, users, open interest, or Backer traction.
- Distinguish creator-economy revenue/ad spend from direct fan investment.
- Keep public discovery and Proof of Attention separate from consent, tradability, settlement, and real-money launch.
- Present real-money operation as dependent on appropriate venue, clearing, legal, and compliance paths.

## Visual and interaction requirements

- Preserve the pitch's off-black, ivory, and restrained amber visual system.
- Replace the generic equal-card evidence block with an asymmetric data composition.
- Reuse the main site's globe markup, styles, poster fallback, labels, lazy in-view rendering, drag/orbit behavior, and reduced-motion behavior.
- Keep source links keyboard accessible with visible focus treatment.
- On narrow screens, stack evidence and globe content without horizontal overflow; the globe must remain non-blocking for page scroll on coarse pointers.

## Acceptance criteria

- The prior quantitative argument is restored with the corrected, source-linked figures above.
- The pitch contains one working `data-globe-live` instance and loads the existing globe module once.
- Globe WebGL renders when available and the poster fallback remains visible if it does not.
- Desktop and mobile renders preserve hierarchy and contain all content.
- No console errors, missing local assets, duplicate IDs, or broken internal links are introduced.
- Release status is reported separately as local, pushed, deployed, and actual-browser verified.
