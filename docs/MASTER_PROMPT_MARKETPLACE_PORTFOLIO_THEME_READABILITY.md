# Master Prompt — Backer Marketplace and Portfolio Theme/Readability Upgrade

You are the senior product designer, frontend engineer, accessibility owner, QA lead, and release owner for this task. Complete the work end to end: inspect the production source, implement the redesign, validate it locally, publish it through the existing GitHub Pages setup, and verify the live result.

## Production target

- Repository: `bokubokulee-gif/backer-site`
- Publishing source: `main`, repository root
- Marketplace URL: `https://bokubokulee-gif.github.io/backer-site/backerdemo.html#market`
- Portfolio URL: `https://bokubokulee-gif.github.io/backer-site/portfolio.html`
- Preserve these exact URLs. Do not create a replacement host or parallel demo.
- The production application is static HTML, CSS, and vanilla JavaScript.
- Primary files:
  - `backerdemo.html`
  - `portfolio.html`
  - `css/styles.css`
  - `css/market.css`
  - `css/app-pages.css`
  - `js/app.js`
  - `js/market.js`

## Problem

The marketplace is visually compressed and difficult to scan. Its tiny metadata, four-column wide-screen layout, translucent cards, dotted shader background, and crowded controls make it feel like a dense analytics dashboard rather than a trading workspace.

The portfolio must feel like the same product and share the same appearance controls.

## Required outcome

1. Make the marketplace and portfolio default to a solid black page canvas.
2. Remove shader, dots, grain, vignette, and decorative background effects from those two product surfaces.
3. Add a light/dark theme control in the top-right navigation immediately beside Portfolio.
4. Make the marketplace meaningfully easier to read and compare while retaining exchange-like information density.
5. Improve portfolio spacing and ledger readability using the same theme system.
6. Preserve all existing marketplace, portfolio, navigation, simulation, filter, watch, drawer, local-storage, and deep-link behavior.
7. Publish the validated result to the existing GitHub Pages URL and verify production.

## Theme system

Build one shared semantic theme system rather than scattered page-specific color patches.

Use semantic variables for:

- page and navigation backgrounds;
- primary, secondary, and elevated panel surfaces;
- primary, secondary, and subdued text;
- borders and dividers;
- inputs and controls;
- hover, selected, and focus states;
- positive, caution, negative, and Backer accent colors;
- overlay and drawer surfaces.

### Dark theme

- Default page canvas: true `#000000`.
- Navigation and sticky controls: opaque black.
- Cards: restrained near-black surfaces such as `#0A0A0C`, with a visible raised state.
- Text: warm white with comfortably legible secondary and tertiary contrast.
- Preserve Backer amber and green/amber/red signal semantics.
- Do not allow decorative effects to show through panels.

### Light theme

- Use Backer’s warm paper character rather than cold blue-white.
- Suggested canvas: `#F3EFE5`.
- Panels: warm white or paper-white.
- Text: dark ink.
- Borders: quiet warm neutral.
- Use darker accessible versions of Backer amber, green, amber-warning, and red.

### Theme behavior

- Default to dark when there is no saved choice.
- Store the explicit choice in local storage under one stable key shared by marketplace and portfolio.
- Apply the saved choice before first paint.
- Refreshes, direct links, and navigation between marketplace and portfolio preserve the choice.
- If local storage is unavailable, both pages continue to work and default safely to dark.
- Set the browser `color-scheme` and `theme-color`.
- The toggle shows a sun/moon-style icon plus “Light” or “Dark” on desktop.
- On compact screens the icon may stand alone.
- The accessible name describes the next action, such as “Switch to light theme.”
- Minimum target size: 44 × 44px.
- Keyboard focus must be obvious in both themes.
- Theme transitions are brief, optional, and disabled by reduced-motion preferences.

## Marketplace readability and trading-platform character

Retain the current featured contract, market feed, controls, Backer Pulse rail, filters, drawers, and data model. Improve hierarchy and comparison rather than inventing new market mechanics.

### Shell and layout

- Maximum shell width: approximately 1760px.
- Desktop gutters: 28–34px; tablet: 18–24px; mobile: 14–16px.
- Main canvas plus a 336px Backer Pulse rail on large desktop.
- Use a 20–24px main/rail gap.
- Move the rail below the main canvas when it would squeeze cards.
- No nested rail scrolling.
- No horizontal page scrolling.

### Contract grid

- 2100px and wider: up to four cards only when each remains comfortably readable.
- 1024–2099px: three cards when the canvas supports them.
- 768–1023px: two cards.
- Below 768px: one card.
- Target card width: at least 300px where possible.
- Target card height: approximately 276–304px.
- Card padding: 18–20px.
- Grid gap: 14–16px.

At the screenshot’s effective width of about 1728 CSS pixels, use three cards, not four.

### Typography

- Page title: 34–42px.
- Featured proposition: 22–28px.
- Contract proposition: 16px or larger, with comfortable line height.
- Creator identity: approximately 14px.
- Normal interface copy: approximately 13–14px.
- Avoid essential labels below 11px.
- Use tabular numerals for comparable market values.
- Reserve the serif face for editorial page and section headings.

### Card hierarchy

Each standard card should scan in this order:

1. creator identity, platform/category, contract state, watch control;
2. two-line contract proposition;
3. current-to-target milestone progress;
4. aligned two-by-two term/evidence area:
   - fixed simulation term;
   - Attention Pulse movement and window;
   - PoA/evidence confidence;
   - material risk;
5. simulated activity and freshness;
6. details plus one clear “Open position” action.

Do not use price, odds, bid, ask, spread, liquidity, or order-book language where those systems do not exist.

### Featured contract

- Give the featured contract the full main-canvas width.
- Do not squeeze a secondary contract beside it at ordinary desktop widths.
- Use a 96px or taller chart area.
- Make proposition, progress, fixed term, source/evidence, and primary action easy to distinguish.
- Preserve the manual featured navigation and all eligibility behavior.

### Controls

- Preserve browse modes, category rail, time windows, quick filters, full filters, sorting, share state, and result counts.
- Sticky controls use an opaque theme background.
- Increase target sizes and avoid tiny labels.
- On mobile, allow control groups to scroll horizontally without causing page overflow.
- Selected states must remain obvious in both themes.

### Backer Pulse rail

- Width: approximately 336px.
- Module padding: 17–20px.
- Module heading: approximately 14px.
- Rows: at least 56px high.
- Primary row copy: approximately 13px.
- Secondary row copy: approximately 11–12px.
- Preserve Your Market, Backer Pulse, Trending, Movers, Risk Watch, and remaining modules.
- On mobile, use the existing in-feed Pulse module and avoid duplicate rail content.

## Portfolio page

- Use the exact same theme preference and semantic tokens.
- Dark canvas is true black, with no shader, dots, grain, or vignette.
- Increase spacing in the identity header, summary cards, performance chart, tabs, filters, position rows, activity rows, creator terminal, and drawers.
- Keep the existing Investor/Creator modes, share behavior, chart ranges, tabs, search, sorting, position details, local demo data, and creator terminal behavior.
- Desktop position rows should read as an aligned brokerage ledger.
- Right-align repeated numeric values on desktop.
- Use approximately 82px row height with 18–20px padding.
- On mobile, stack the same row content intentionally into a two-column card.
- Do not change portfolio calculations or fixture values as part of this visual task.

## Navigation placement

On marketplace and portfolio:

- Place the theme button between Portfolio and Enter Backer Market.
- Maintain a logical keyboard order.
- Theme switching must not navigate, reset filters, or reset scroll.
- Keep the control reachable at mobile widths even when Portfolio text is hidden.

## Sitewide liquid-glass CTA system

Apply Backer’s smoked-navy liquid-glass material to these five labels wherever
they appear as standalone calls to action:

- `Portfolio`
- `Enter Backer Market`
- `Read Backer Thesis 1.0`
- `See the pitch`
- `Chat with Backer AI`

Mark each intended instance explicitly with `data-liquid-cta` and a neutral,
primary, or panel variant. Do not use text-matching JavaScript and do not
restyle body copy, footer navigation, icon-only dock controls, or the Portfolio
section tab on the standalone market detail page.

The shared component belongs in `css/liquid-glass.css` and must provide:

- a stable translucent smoked-navy fill on dark surfaces;
- silver-blue optical rims, a quiet lower-left caustic, and a restrained
  upper-right specular highlight;
- a warm-paper glass inversion on the light marketplace and portfolio themes;
- sharp foreground labels and icons above every decorative layer;
- a 44px minimum target, visible focus ring, hover lift, and pressed state;
- solid readable fallbacks for unsupported backdrop filters and
  `prefers-reduced-transparency`;
- no autonomous shimmer, and no transform animation under
  `prefers-reduced-motion`;
- a forced-colors fallback using system button colors.

Keep Enter Backer Market as the subtly warm primary variant. Keep Portfolio and
Chat with Backer AI neutral. Keep the two reading paths in their existing
two-column information architecture, using the larger panel variant. Preserve
every existing `href`, `data-view`, icon, analytics hook, and navigation
outcome. Do not re-enable glass on marketplace cards, portfolio rows, or other
dense trading surfaces.

## Preserve product truth

Do not:

- remove or weaken simulated-data or no-real-money disclosures;
- invent live prices, probabilities, liquidity, an order book, or settlement;
- alter market values, portfolio values, filters, local positions, routes, or analytics without a required regression fix;
- rewrite unrelated marketing, thesis, FAQ, privacy, or analytics pages;
- deploy from the unrelated local Next/Vinext application;
- claim the launch succeeded before checking the public pages.

Both `#market` and `?view=market` must continue to open the marketplace.

## Accessibility

- Meet WCAG 2.2 AA contrast.
- Use 4.5:1 contrast for normal text and 3:1 for large text and meaningful UI boundaries.
- Preserve keyboard operation for theme, filters, sorting, tabs, cards, watch controls, and drawers.
- Use visible focus indicators in both themes.
- Icon-only controls need accessible names.
- Do not communicate positive, caution, or negative states by color alone.
- Respect reduced-motion preferences.
- Maintain at least 44px touch targets for primary mobile controls.

## Verification and release

Before publishing:

1. Record the current production commit for rollback.
2. Confirm the worktree contains no unrelated changes.
3. Test through a local HTTP server.
4. Test marketplace and portfolio in dark and light themes.
5. Check approximately 390, 768, 1024, 1440, 1728, and 2100px widths.
6. Confirm there is no horizontal page overflow.
7. Confirm the theme persists across refreshes and between pages.
8. Confirm both market deep-link forms still work.
9. Exercise filters, sorting, watch, details, position drawers, portfolio tabs, search, sorting, and drawers.
10. Check console output and asset requests.
11. Run the repository lint and automated tests.
12. Update cache-busting versions for edited CSS and JavaScript assets.
13. Commit only the intended production files.
14. Push `main` to the existing origin.
15. Wait for GitHub Pages to publish.
16. Verify both public URLs with a cache-busting query.
17. Keep the previous commit available for rollback until verification passes.

## Acceptance checklist

### Theme

- [ ] A fresh visit defaults to dark.
- [ ] Marketplace canvas computes to `rgb(0, 0, 0)`.
- [ ] Portfolio canvas computes to `rgb(0, 0, 0)`.
- [ ] No shader, dotted pattern, grain, vignette, or page gutter remains on those surfaces.
- [ ] The toggle appears immediately beside Portfolio.
- [ ] It remains available on mobile.
- [ ] Its label, icon, tooltip, and pressed state update correctly.
- [ ] It works with mouse, touch, Enter, and Space.
- [ ] It has visible focus in both themes.
- [ ] Theme choice persists across refresh and between marketplace and portfolio.
- [ ] Direct marketplace and portfolio links use the saved theme.
- [ ] Blocked local storage does not break the pages.

### Marketplace

- [ ] The 1728px layout uses three comfortable cards, not four compressed cards.
- [ ] Standard card titles are at least approximately 16px.
- [ ] Cards have visibly increased padding and vertical breathing room.
- [ ] Repeated fields align consistently.
- [ ] The featured contract uses the full main-canvas width.
- [ ] The right rail does not squeeze the contract grid.
- [ ] Sticky controls do not overlap page content.
- [ ] Selected filters remain obvious.
- [ ] Mobile cards use one column and actions remain tappable.
- [ ] No viewport creates horizontal page scrolling.
- [ ] The marketplace still feels information-dense without feeling miniature.

### Portfolio

- [ ] Identity and navigation controls do not collide.
- [ ] Summary values and labels are comfortably readable.
- [ ] Performance chart controls remain legible.
- [ ] Position rows align on desktop and stack deliberately on mobile.
- [ ] Investor/Creator switching works.
- [ ] Positions/Activity switching works.
- [ ] Search, filters, sorting, share, details, and drawers work.
- [ ] Existing data remains unchanged after theme switching.

### Regression and production

- [ ] Every standalone instance of the five named CTAs is explicitly marked and uses the correct liquid-glass variant.
- [ ] Named CTA text, icons, navigation behavior, keyboard focus, hover, and active states work in dark and light contexts.
- [ ] Plain footer links, dock icons, body copy, and market-detail tabs remain unchanged.
- [ ] Reduced-motion, reduced-transparency, forced-colors, and no-backdrop-filter fallbacks remain readable.
- [ ] `backerdemo.html#market` opens the marketplace.
- [ ] `backerdemo.html?view=market` opens the marketplace.
- [ ] Portfolio navigation works in both directions.
- [ ] Marketplace search, categories, windows, filters, sorting, share, watch, featured navigation, details, and position flow still work.
- [ ] Simulation disclosures remain visible.
- [ ] No new fake exchange mechanics were introduced.
- [ ] No console errors or missing assets appear.
- [ ] Unrelated marketing pages retain their existing appearance.
- [ ] Lint and automated tests pass.
- [ ] GitHub Pages serves the tested commit.
- [ ] Both exact public URLs return the new version.

## Completion report

Report:

- what changed;
- files changed;
- validation performed and results;
- deployed commit;
- GitHub Pages status;
- exact verified marketplace and portfolio URLs;
- any remaining limitations.

Do not stop after producing a prompt, mockup, or local build. The task is complete only when the existing public URL serves the verified implementation.
