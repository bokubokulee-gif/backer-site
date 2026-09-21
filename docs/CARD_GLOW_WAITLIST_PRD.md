# Card borders and public preview access

## Requested outcome
Apply the supplied pointer-following GlowingEffect border to cards throughout the homepage, Trades, Discovery, search results, and both pitch aliases. Preserve existing liquid glass/metal surfaces, typography, layout, and interaction. The site remains vanilla HTML/CSS/JavaScript; adapt the effect without a framework migration.

Visitors can browse markets and events. Portfolio and commitment actions (Back, Fade, orders, proposals) lead to the existing waitlist screen. A waitlist entry does not unlock trading.

## Visual implementation
A decorative, pointer-transparent child draws a 3px multicolor directional ring inside each card. Card backgrounds, backdrop filters, rim shadows, parent pseudo-elements and positioning remain owned by their existing styles. A shared listener updates visible cards; new results and rerenders are decorated automatically. Reduced motion uses static feedback; keyboard focus and touch remain supported.

## Rounded-edge refinement
Both the outer contour and inner cutout must follow continuous rounded curves, including at high zoom. Use explicit even-odd vector clipping rather than a rectangular content-box mask. Resolve all four corner radii from the actual layer, preserve fractional stroke widths, and update the geometry on resize, dynamic replacement and disclosure expansion. The same geometry must cover the independently animated Research stage and caption. Verify all six consuming pages and English, Chinese, Japanese and Korean variants before publishing both hosts.

## Access and registration
Load the access guard before application scripts; guard action handlers and direct portfolio/position routes. Replace the standalone Portfolio document with a waitlist redirect and visible fallback link. Browsing and detail navigation remain available.

The existing waitlist only saved local browser data. Remove that success fallback: confirm registration only after a configured server responds with explicit acceptance. Prepare a Vercel/PostgreSQL endpoint using the existing backend conventions. GitHub Pages serves the website; registration storage requires a configured database and deployed API. Do not claim collection is active until verified.

## Acceptance
- Inspect desktop and narrow renders on homepage, pitch, Trades, Discovery and search.
- Hover direction, keyboard feedback, reduced motion and dynamic search replacement work without card layout changes.
- Glass/metal backgrounds and existing word effects remain intact.
- Portfolio routes and commitment actions navigate to waitlist, including deep links and embedded previews.
- Browsing remains open; blocked actions create no local positions/orders.
- Missing or failing waitlist API never displays registration success.
- Audit the allowlisted public artifact before publishing. Backend code, migrations and tests remain outside the static artifact.
