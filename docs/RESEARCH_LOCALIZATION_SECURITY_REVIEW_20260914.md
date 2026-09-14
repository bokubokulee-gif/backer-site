# Research localization release review — 14 September 2026

This review covers three browser scripts changed by the Chinese, Japanese, and Korean localization release. The English source copy and existing research evidence boundaries remain intact. This record is internal and is not included in the public build allowlist.

## Scope and behavior

- `research-lab/assets/lab-public-v1.js`: the stage-label presenter resolves the existing label through `window.BackerI18n.t` when the locale runtime is present, then measures and draws the returned text. Without the runtime, it draws the original English label. No marker state, model inputs, formulas, forecasts, or data requests changed.
- `research-lab/assets/attention-flow-public-v1.js`: the selected marker's DOM label resolves the same stage text through the locale runtime. The update compares against the translated label to avoid repeated writes and locale-observer churn. Marker transitions, animation timing, and authored examples are unchanged.
- `research-lab/assets/locale-lineage.js`: a static locale dictionary containing translations of two provenance statements already visible in the public Research Lab pages. It retains the statements' limits on evidence and sample representativeness. It registers strings under `BackerLocalePacks.lineage`; it contains no network requests, dynamic code execution, model logic, private data, credentials, or acquisition implementation. This Lab-only pack keeps research provenance out of core Market and Discovery locale bundles.

The existing blocked simulation-engine entries and all reviewed public-data digests are unchanged. The narrow script-manifest updates do not relax the release gate.

## Reviewed bytes

The manifest pins emitted output, not source bytes. Output was produced with the same esbuild options as `scripts/build-pages-artifact.mjs`: JavaScript loader, target `es2020`, minification enabled, source maps disabled, inline legal comments, and UTF-8 charset.

| Script | Source SHA-256 | Emitted SHA-256 |
| --- | --- | --- |
| `attention-flow-public-v1.js` | `1a3608b696da37aebf6ba92179b6f8e7799e34c1f49ec8b0b657fd8a91def7e0` | `9e0bd3fbdbee4233197b719874e46b85102e264ac7e2f359d0424f8027942ba7` |
| `lab-public-v1.js` | `fcb15da551b394b270828c1857f6edba846242e70593c383b7a1f1a56d4f0564` | `32edad23d351689be50a7f001e4193d4f53c8a56aa246bd55f494fc17b34cda2` |
| `locale-lineage.js` | `39772a8fd5a195ee5f3d6680b8d7654eaba4ee4a513528959a19287e3fa1a434` | `92a8775600512b136394b6c3d0e07ad1a41e24e61a6b0f8201a4648e13cde1c4` |

## Validation

Source syntax checks and locale catalog shape/placeholder checks passed before this review. `node --test tests/core-public-exposure.test.js` passed all seven existing policy tests. `node scripts/build-pages-artifact.mjs /tmp/backer-research-security-20260914` built and audited all 188 allowlisted files with zero critical findings. The build inspected the emitted bytes against the updated manifest. This review does not assert that a deployment has occurred.
