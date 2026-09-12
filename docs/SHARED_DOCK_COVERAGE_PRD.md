# Shared navigation coverage

The pitch pages load the dock stylesheet but omit its mount and script. Nested Research Lab pages also omit the shared navigation. Add the existing Search, Discovery, Home, Trades and Portfolio dock to every published HTML interface, retaining its appearance, drag positioning, minimize/restore and keyboard behavior.

Use the dock script URL to resolve destinations relative to the site root, so links work on root pages, nested research routes and the analytics shell under GitHub Pages. Only application routes should mark the corresponding dock destination as current; a pitch section or Research Lab index must not claim a different page's current state. Preserve existing redirects and authentication.

Mount the dock outside page content. The top-level site owns navigation when a site page is used as an embedded preview, avoiding duplicate docks inside those frames. Keep the existing responsive component sizing and modal behavior.

Acceptance: every allowlisted HTML page includes the component exactly once; root and nested destinations resolve correctly; the dock appears on both pitch routes and Research Lab at mobile and desktop widths; navigation, minimize/restore and position persistence work. Build and audit the public artifact, publish, and verify the deployed output.
