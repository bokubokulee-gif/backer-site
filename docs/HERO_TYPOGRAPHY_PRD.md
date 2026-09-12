# Consistent Backer headline typography

Replace decorative serif and italic font switches in heroes, section headlines, prominent statements and display-card headings across the public Backer interfaces. Use each interface's existing sans-serif family; emphasized words inherit the surrounding heading's weight and style. Keep all copy, colors, gradients, word-hover effects, links and interactions. Leave body quotations, data fonts and non-heading editorial emphasis alone. This request supersedes the earlier mixed sans/serif design direction.

Audit all published HTML routes and the styles behind dynamic application views. Check the annotated pitch sections, representative marketing and application routes, mobile and desktop layouts, and preserved hover/reduced-motion behavior. Any font-size adjustment must be limited to preventing overflow caused by the wider replacement face. Build the allowlisted public artifact, publish the reviewed changes, and verify the exact live output.

## Acceptance
- Source coverage includes every public HTML route, redirect destination, and heading styles used by dynamic Market/account interfaces. Existing sans Research Lab content and hosted Attention Simulation require no font switch.
- Browser audits covered 21 desktop route/view combinations and the corresponding mobile interfaces at 320px. No checked heading retains serif/italic switches or text overflow. The pitch also fits at 415px; only its second hero line needed a font-size rule below 420px to preserve one complete line.
- Rendered pitch hero, bridge, Research/co-design headings, mobile Search and Signup were inspected. Gradient and white word-hover transforms still work; reduced-motion disables movement. No animation code changed.
- All changed HTML preserves visible copy. Shared stylesheet references and the lazy Market stylesheet use refreshed cache keys. Lint, six public-exposure tests and the 173-file audited build pass.
- Existing FAQ decorative spiral extends beyond the page bounds independently of typography; its text headings fit. No unrelated layout or graphic changes were made.
