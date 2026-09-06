# Research robot release checks — September 6, 2026

Scope: research.html and shared Backer Research navigation. Uses the supplied procedural robot shape with warm ivory/graphite/champagne materials, gold trading accents and muted green attention accents.

- Core checks: 146 passed, zero failures. Lint and diff whitespace checks passed.
- Public artifact: 155 allowlisted files, zero critical exposure findings; locally bundled Three.js, no source maps or remote model/environment assets.
- Browser: 1440x1000, 1280x900, 390x844 and 320x740. Fixed orbit-rotation overflow and narrow grid minimum sizing. Final DOM checks show no horizontal overflow.
- Preview selection changes active tab, panel and destination. Arrow-key selection and Enter greeting verified; robot displays temporary heart eyes.
- Mobile Research link navigates directly to the canonical research.html without an intermediate submenu. Product/Company retain their existing accordion.
- Reduced-motion mode and explicit greeting checked. Simulated WebGL context loss disables the robot control, restores the Backer mark and preserves preview selection/navigation. The simulation was reset by reloading.
- Browser console had no runtime errors after successful rendering. Intentionally induced context loss and the initial pre-bundle missing script occurred only during development.

Release target: https://bokubokulee-gif.github.io/backer-site/research.html
Live verification is performed after the source and audited Pages artifact are pushed.
