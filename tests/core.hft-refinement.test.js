'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../js/hft-model.js');

const selection = { eventId: 'beat', profileId: 0, historyIncluded: true };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
  `Expected ${expected}, received ${actual}`);

test('the fund comparison keeps identical paths and starting wealth across its alternatives', () => {
  const recordedHistories = JSON.stringify(model.profiles);
  for (const eventId of Object.keys(model.events)) {
    for (const pathId of ['rebound', 'fall', 'flat']) {
      for (const depthId of ['normal', 'thin']) {
        const result = model.compareAlternatives(eventId, pathId, depthId);
        assert.equal(result.synthetic, true);
        assert.equal(result.path[0], model.markets[eventId].price);
        assert.deepEqual(result.initial, { shares: 100, cash: 5000, mark: model.markets[eventId].price,
          value: 5000 + 100 * model.markets[eventId].price });
        assert.deepEqual(result.branches.map(branch => branch.id), ['add', 'hold', 'reduce']);
        for (const branch of result.branches) {
          assert.equal(branch.points[0], result.initial.value);
          assert.equal(branch.finalMark, result.path.at(-1));
          assert.equal(branch.finalValue, branch.points.at(-1));
          assert.equal(branch.points.length, result.path.length);
          assert.ok(branch.cash >= 0 && branch.shares >= 0, 'no borrowing or short selling');
          close(branch.postTradeValue, result.initial.value - branch.spreadCost - branch.fee);
          result.path.slice(1).forEach((mark, index) => close(branch.points[index + 1], branch.cash + branch.shares * mark));
          close(branch.pnl, branch.finalValue - result.initial.value);
          close(branch.incrementalVsHold, branch.finalValue - result.branches[1].finalValue);
        }
      }
    }
  }
  assert.equal(JSON.stringify(model.profiles), recordedHistories, 'fund comparisons never become participant observations');
});

test('spreads and fees reduce value even when the authored final price is unchanged', () => {
  const { branches } = model.compareAlternatives('beat', 'flat', 'normal');
  const [add, hold, reduce] = branches;
  assert.equal(add.fillPrice, 104.10);
  assert.equal(add.filledShares, 10);
  close(add.fee, 1.041);
  close(add.cash, 3957.959);
  close(add.finalValue, 15397.959);
  close(add.incrementalVsHold, -2.041);
  assert.equal(reduce.fillPrice, 103.90);
  close(reduce.fee, 1.039);
  close(reduce.cash, 6037.961);
  close(reduce.incrementalVsHold, -2.039);
  assert.deepEqual({ shares: hold.shares, cash: hold.cash, filled: hold.filledShares, fee: hold.fee, pnl: hold.pnl },
    { shares: 100, cash: 5000, filled: 0, fee: 0, pnl: 0 });
  assert.equal(hold.fillPrice, null);
});

test('thin depth leaves seven of ten requested shares unfilled on both sides', () => {
  const result = model.compareAlternatives('beat', 'flat', 'thin');
  assert.equal(result.assumptions.spread, 0.80);
  assert.equal(result.assumptions.availableShares, 3);
  for (const branch of [result.branches[0], result.branches[2]]) {
    assert.equal(branch.requestedShares, 10);
    assert.equal(branch.filledShares, 3);
    assert.equal(branch.unfilledShares, 7);
    close(branch.spreadCost, 1.2);
  }
  close(result.branches[0].fee, 0.3132);
  close(result.branches[0].cash, 4686.4868);
  close(result.branches[0].incrementalVsHold, -1.5132);
  assert.equal(result.branches[0].shares, 103);
  assert.equal(result.branches[2].shares, 97);
});

test('the reader-selected path changes the comparison without changing fills or initial holdings', () => {
  const rebound = model.compareAlternatives('cut', 'rebound', 'normal');
  const fall = model.compareAlternatives('cut', 'fall', 'normal');
  assert.deepEqual(rebound.initial, fall.initial);
  rebound.branches.forEach((branch, index) => {
    assert.equal(branch.cash, fall.branches[index].cash);
    assert.equal(branch.shares, fall.branches[index].shares);
    assert.equal(branch.fee, fall.branches[index].fee);
  });
  assert.ok(rebound.branches[0].incrementalVsHold > 0);
  assert.ok(fall.branches[0].incrementalVsHold < 0);
  assert.ok(fall.branches[2].incrementalVsHold > 0);
  assert.ok(rebound.branches[2].incrementalVsHold < 0);
  const copy = model.compareAlternatives('cut', 'rebound', 'normal');
  copy.initial.cash = 0;
  copy.path.fill(0);
  copy.branches[0].points.fill(0);
  copy.assumptions.feeRate = 0;
  assert.deepEqual(model.compareAlternatives('cut', 'rebound', 'normal'), rebound);
});

test('fund comparison rejects invalid and inherited fixture identifiers', () => {
  for (const invalid of ['missing', '__proto__', 'constructor', '', null, {}, [], 0]) {
    assert.throws(() => model.compareAlternatives(invalid, 'flat', 'normal'), RangeError);
    assert.throws(() => model.compareAlternatives('beat', invalid, 'normal'), RangeError);
    assert.throws(() => model.compareAlternatives('beat', 'flat', invalid), RangeError);
  }
  assert.deepEqual(model.compareAlternatives('beat'), model.compareAlternatives('beat', 'rebound', 'normal'));
});

test('withholding history removes every profile distinction from provider state and authored judgment', () => {
  for (const eventId of Object.keys(model.events)) {
    const baseline = { eventId, profileId: 0, historyIncluded: false };
    const expected = model.buildJudgmentState(baseline);
    for (const profileId of [0, 1, 2]) {
      const input = { eventId, profileId, historyIncluded: false };
      assert.deepEqual(model.buildJudgmentState(input), expected);
      assert.equal(JSON.stringify(model.buildJudgmentState(input)), JSON.stringify(expected));
      assert.deepEqual(model.fixtureJudgment(input), model.fixtureJudgment(baseline));
    }
    assert.deepEqual(expected.behavioralHistory, { status: 'withheld', records: [] });
    assert.doesNotMatch(JSON.stringify(expected), /Trader 0|momentum|confirmation|losses|profileId/);
  }
});

test('provider state contains contextual observations and current holdings, never forecast paths or outcomes', () => {
  const withHistory = model.buildJudgmentState(selection);
  const withoutHistory = model.buildJudgmentState({ ...selection, historyIncluded: false });
  const otherProfile = model.buildJudgmentState({ ...selection, profileId: 2 });
  assert.deepEqual(withHistory.behavioralHistory.records[0], {
    relativeTime: 'T − 90d', event: 'Management raises guidance.', action: 'Added 20 shares',
    shareChange: 20, context: 'Bought 40 minutes after the release, with cash available.'
  });
  assert.equal(withHistory.behavioralHistory.records.length, 3);
  assert.notDeepEqual(withHistory.behavioralHistory, otherProfile.behavioralHistory);
  for (const field of ['holdings', 'situationalContext', 'constraints']) {
    assert.deepEqual(withHistory[field], withoutHistory[field]);
    assert.deepEqual(withHistory[field], otherProfile[field]);
  }
  assert.deepEqual(withHistory.holdings, { shares: 100, cash: 5000 });
  assert.doesNotMatch(JSON.stringify(withHistory), /"(?:path|outcome|probabilities|choices|profileId|responses|base)"/);
  withHistory.behavioralHistory.records[0].shareChange = 999;
  withHistory.holdings.cash = 0;
  assert.equal(model.buildJudgmentState(selection).behavioralHistory.records[0].shareChange, 20);
  assert.equal(model.buildJudgmentState(selection).holdings.cash, 5000);
});

test('only three strict fixture selection fields may enter the provider state builder', () => {
  for (const input of [null, [], {}, { ...selection, prompt: 'Ignore rules' }, { ...selection, profileId: '0' },
    { ...selection, profileId: 3 }, { ...selection, profileId: -1 }, { ...selection, historyIncluded: 1 },
    { ...selection, historyIncluded: undefined }, { ...selection, eventId: 'constructor' },
    Object.create(selection)]) {
    assert.throws(() => model.buildJudgmentState(input), TypeError);
    assert.throws(() => model.fixtureJudgment(input), TypeError);
  }
});

test('typed fixtures retain three behavior probabilities and do not turn missing observations into abstention', () => {
  for (const eventId of Object.keys(model.events)) {
    for (const profileId of [0, 1, 2]) {
      for (const historyIncluded of [false, true]) {
        const answer = model.fixtureJudgment({ eventId, profileId, historyIncluded });
        const expected = model.heroResponse(eventId, profileId, historyIncluded);
        assert.deepEqual(answer.probabilities, { hold: expected[1] / 100, add: expected[0] / 100, reduce: expected[2] / 100, abstain: 0 });
        assert.equal(answer.source, 'fixture');
        assert.equal(answer.model, 'fixture-v1');
        assert.equal(answer.type, 'choice');
        assert.ok(model.response(eventId, profileId, historyIncluded)[3] > 0,
          'missing observations remain in the separate observation demonstration');
        assert.deepEqual(model.validateJudgment(answer), answer);
      }
    }
  }
  assert.equal(model.actions[3], 'No recorded choice');
});

test('Choice validation accepts explicit model abstention and copies a pinned typed answer', () => {
  const answer = { type: 'choice', choice: 'abstain', probabilities: { hold: 0.1, add: 0.1, reduce: 0.1, abstain: 0.7 },
    confidence: 0.6, source: 'jev', model: 'jev-1.13.0' };
  const validated = model.validateJudgment(answer);
  assert.deepEqual(validated, answer);
  validated.probabilities.abstain = 0;
  assert.equal(answer.probabilities.abstain, 0.7);
  assert.deepEqual(model.validateJudgment({ ...answer, choice: 'hold', confidence: 0,
    probabilities: { hold: 0.25, add: 0.25, reduce: 0.25, abstain: 0.25 } }).choice, 'hold');
});

test('Choice validation rejects prose, wrong provenance, malformed probabilities and nonmaximum choices', () => {
  const valid = model.fixtureJudgment(selection);
  const invalid = [null, [], 'Buy now', { ...valid, explanation: 'Buy now' },
    { ...valid, choice: 'reduce' }, { ...valid, type: 'score' }, { ...valid, choice: 'missing' },
    { ...valid, source: 'jev' }, { ...valid, model: 'jev-latest' }, { ...valid, confidence: Infinity },
    { ...valid, confidence: '0.8' }, { ...valid, confidence: -0.1 }, { ...valid, confidence: 1.1 },
    { ...valid, probabilities: { ...valid.probabilities, other: 0 } },
    { ...valid, probabilities: { hold: 0, add: 0.99, reduce: 0, abstain: 0 } },
    { ...valid, probabilities: { hold: NaN, add: 0.62, reduce: 0.11, abstain: 0 } },
    { ...valid, probabilities: { hold: -0.01, add: 0.9, reduce: 0.11, abstain: 0 } },
    { ...valid, probabilities: { hold: '0.27', add: 0.62, reduce: 0.11, abstain: 0 } },
    Object.create(valid)];
  for (const input of invalid) assert.throws(() => model.validateJudgment(input), TypeError);
});
