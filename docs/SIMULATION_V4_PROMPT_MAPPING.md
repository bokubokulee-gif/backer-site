# Supplied component prompts → Backer interactions

The four supplied files were read as interaction specifications. Backer’s existing site is static HTML/CSS/JavaScript; the visual geometry and interaction mechanics are adapted into that runtime rather than introducing a second React/Next application. All examples retain their scientific meaning when motion is disabled.

| Supplied component | Mechanism retained | Backer integration | Deliberate adaptation |
| --- | --- | --- | --- |
| **GatewayFlow**, attachment `a084e7b5-6bb6-42b9-b30d-06e21531550f` | Cubic Bézier paths (`getBezierPoint`), particles travelling along paths, click-origin pulses | Overview population instrument; root-owned `js/simulation-story.js` (`bezier`, `launch`) and `css/simulation.css` | Paths connect signal, channel and population. Clicking the source launches exposure along these paths. The original login form, clock monkey-patching, arbitrary explosions and random path drift do not describe Backer’s model. |
| **ScrollExpandMedia**, attachment `0f3976ae-1cdf-4eff-9844-519065beb23a` | A compact opening scene expands with scroll; surrounding title/media composition changes continuously | Overview entrance into the population story; root-owned `js/simulation-motion.js` and `css/simulation.css` | Expansion follows native document scroll. No wheel interception, forced scroll-to-top or blocked touch scrolling. The expanding subject is the interactive scientific scene rather than a decorative video. |
| **ScannerCardStream**, attachment `a689ef0b-548a-4bfc-b28e-f2c15fb69f33` | A source card crosses a scan line; complementary clip masks reveal the transformed view; direct dragging and record navigation | `#signal-scanner`, `css/simulation-atmosphere.css`, `js/simulation-atmosphere.js` | Four fictional, authored records replace unrelated photos. The ASCII tree is a real feature mapping for the same record, not random code. Pointer, touch, keyboard and cleanup behavior are implemented; the supplied template left several input/cleanup handlers as stubs. On narrow screens the beam sweeps within one readable card. |
| **FunnelChart**, attachment `64f2529b-a003-49a7-aa09-2cdb3f78ef46` | Curved segment paths, nested layers, staggered spring entrance, expansion of selected layers, orientation change | Marketing & Brand experiment in `js/simulation-usecases.js` / `css/simulation-usecases.css`; use-case agent owns integration | Stage widths represent cumulative outcomes from the same initial population. Selecting a stage exposes its count and interpretation. Keyboard/touch selection supplements hover, and mobile uses a vertical arrangement. |

## Scanner interaction contract

Desktop has a white source on the right, a fixed central beam and the structured record on the left after scanning. Drag the source left, click it, or activate **Scan signal**. As the source moves, exact complementary clipping changes it into its authored feature tree. The completed source remains visible for comparison. Select any feature to highlight the exact supporting phrase; fields marked **Not observed** explicitly report the absence of supporting evidence.

Below 700px scene width, the source and features share one full-width reading position. A drag or scan action sweeps the beam across the card; **Read source** reverses the view. This preserves text size instead of compressing two records. Previous/next buttons and the region’s left/right arrow keys select among the four records. Enter/Space on the region scans or reverses. There is no range slider.

Records: a public post distinguishing attention from trial; a product review stating setup friction; an earnings note distinguishing spending from returns; and a company notice distinguishing evaluation access from purchase authority. Every timestamp and source is explicitly fictional. The component makes no network request and performs no inference.

The scan is a finite animation. Reduced motion completes it immediately. Leaving the viewport or hiding the document completes any pending state transition and cancels its animation frame; the component has no idle animation loop. Resize recalculates physical card/beam positions. Vertical touch scrolling remains native.

## Integration API

Load `css/simulation-atmosphere.css` and defer `js/simulation-atmosphere.js`, then provide an empty `<section id="signal-scanner" class="sim-shell"></section>`. The script automatically mounts the full heading, scene and caption. Styles are restricted to `#signal-scanner .ss-*`.

For an explicitly created mount, call `window.BackerSignalScanner.mount(element)`. The returned instance exposes `select(index)`, `scan()`, `reset()`, `getState()` and `destroy()`. It is also available as `element.__backerSignalScanner`. Successful scans dispatch bubbling `backer:signal-scanned` with `{sourceId, index, features:[{name,value,evidence}]}`. No model behavior elsewhere is changed implicitly.

## Verification evidence

Source preview: `http://127.0.0.1:4281/simulation.html`. At 1440, 390 and 320px, all four sources were scanned and their source links selected: 12 rendered states, no browser errors and no horizontal document overflow. Source and result screenshots were inspected. All four 320px source quotes retain at least 24.5px clearance above their footer at 19px type. Evidence is in `/tmp/backer-scanner-review/` (`report.json`, `source-320-*.png` and `scanner-<width>-*.png`). Actual mouse dragging, CDP touch dragging, keyboard next/scan, absent-evidence inspection and cancellation when offscreen passed; states are recorded in `interaction-report.json`.

This document records the source mapping and the scanner’s checks. It is not a claim that every other V4 surface has completed independent visual acceptance.
