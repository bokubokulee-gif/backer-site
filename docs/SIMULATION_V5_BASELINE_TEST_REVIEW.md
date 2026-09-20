# V5 baseline test investigation

20 September 2026. Four broad-suite failures were reproduced against a clean detached checkout of `origin/main`, commit `fcdd1352b032507c13d78439679fb569034f9d11`, in `/tmp/backer-v5-baseline`. The same two test files produced 33 passes and the same four failures before any diagnostic edits. They are pre-existing fixture failures, not Research/Simulation product regressions.

## Causes and minimal corrections

1. Three `core-market-builder-contract.test.js` save/edit tests omitted `BackerAccessGate` from their VM window fixture. Existing `saveDraft()` in `js/market-builder.js` intentionally returns before saving when the gate is missing or requires the waitlist. The fixture now explicitly models an admitted user with `BackerAccessGate: { requireWaitlist: () => false }`. Production gate code is unchanged; the dedicated gate suite still runs.
2. The YouTube derived-metric filtering test in `core-market2.test.js` supplied an account refreshed on 11 August 2026 but omitted the `nowValue` argument to `sanitizePerson()`. The real September date exceeds the existing 30-day retention window, so the correct fail-closed result is `null` before metric filtering. The test now supplies `2026-08-11T00:00:00Z`, matching its fixture. The separate stale-observation test continues to exercise expiry.

No Market builder, store, repository or other product code changed in this investigation.

## Verification

- Clean baseline: 37 tests, 33 passed, four matching failures. Log: `/tmp/backer-v5-baseline-tests.log`.
- Baseline with the two fixture corrections: all 37 passed. Log: `/tmp/backer-v5-baseline-corrected-tests.log`.
- Current V5 worktree, corrected contract and Market 2 tests plus the existing access-gate suite: all 44 passed. Log: `/tmp/backer-v5-market-regression-verified.log`.
- `git diff --check` passed.

The temporary baseline was restored to its original clean state after the experiment. The diagnostic patch is retained at `/tmp/backer-v5-baseline-fixture-fix.patch`.
