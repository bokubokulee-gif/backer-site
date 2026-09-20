# Research attention integration verification — 2026-09-20

## Source and scope
Built from fresh origin/main 2b5adc5 in a dedicated worktree. The approved local particle renderer is preserved, with scoped page controls and offscreen suspension. The exact requested English description is included. No standalone Explore link/footer, simulation label, pause button or gateway plus signs remain in the embedded markup.

## Visual and interaction checks
- Desktop 1280×720, 1066×747 and1440×900: heading→introduction→expanding card→robot sequence inspected. All stages and step navigation work; final caption is centered.
- Mobile390×844 and320×568: inspected entry, sphere, captions and controls; no horizontal overflow or text clipping. Existing responsive site menu remains available.
- The floating dock becomes hidden/inert only while the scene is pinned, and returns at the release into original Research content. The user's dock position and collapsed state are not changed.
- Original robot reports ready; Enter changes heart-eye aria-pressed to true and greeting appears. Original orbit animation and changing action word remain active.
- Both native gateway disclosures open. Glow layer bounds follow the entire card including expanded links. All nine destinations retain relative same-host paths.
- System reduced-motion emulation: final stage canvas unchanged across12 animation frames; controls and previous-step navigation remain functional. Emulation reset afterward.
- Chinese desktop render inspected; new scene copy is present in the existing four-language catalog. Default remains English.
- Runtime exception/log observation produced no application errors during local checks.

## Code and artifact validation
- Full lint passed;263/263 repository tests passed.
- Subsequent targeted integration, host-routing and localization checks:16/16 passed.
- All changed CSS/JS parsed by esbuild with zero warnings. HTML nesting valid, no duplicate IDs, all37 local references resolve.
- Public artifact includes only allowlisted files; new modules and all four local fonts included.216 files inspected, zero critical public-exposure findings.

Production verification is recorded in the delivery response after deployment.
