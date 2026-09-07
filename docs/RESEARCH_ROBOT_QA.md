# Research robot release checks — September 7, 2026

Scope: research.html robot interaction, single-line preview titles, and shared Backer Research navigation hover animation. Retains the warm ivory/graphite/champagne robot materials, gold trading accents and muted green attention accents.

- Pointer movement beyond both sides of the robot container visibly turns the head. Tracking now includes the full document, including navigation controls; the robot body stays centered.
- A click toggles persistent heart eyes on; a second click toggles them off. The state persisted beyond the former timeout. Enter/Space also toggle the state, including with reduced motion enabled. aria-pressed matches the visible expression.
- Removed the visible robot hint at user request, retaining accessible keyboard guidance.
- The exact card titles are Trading Behavior Research Preview and Human Attention Prediction Research. Both fit on one line at 320, 369, 390, 609, 700, 801 and 1280px, with no horizontal overflow. Cards stay stacked through 800px to preserve room for the full titles; narrow-screen type scales with viewport width.
- Research now uses the shared letter-swap hover/focus handler. Browser inspection captured intermediate scrambled text and a stable 136px link width. Product and Company dropdowns still open normally. Research remains a direct canonical-page link with no dropdown.
- Existing preview destinations, simulated descriptions and validation protocol link remain intact. Previously discarded open-preview CTAs and modeled-research sentence remain absent.
- Touch movement cancellation, release-inside guards, passive scrolling, primary-pointer checks and listener cleanup were reviewed. Actual touch hardware interaction was not verified; the in-app browser does not support touch-event dispatch.
- Reduced-motion overrides were reset after testing. No robot runtime warnings or errors were observed in normal rendering.

Final local validation: 146 core tests passed, zero failures; lint and whitespace checks passed. The release artifact contains 155 allowlisted files with zero critical exposure findings. Live verification follows the source and Pages pushes.
Release target: https://bokubokulee-gif.github.io/backer-site/research.html
