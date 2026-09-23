'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../js/hft-model.js');

test('authored response distributions conserve probability and isolate history from public event', () => {
  for (const event of Object.keys(model.events)) {
    const reference = model.response(event, 0, false);
    for (let profile = 0; profile < model.profiles.length; profile += 1) {
      for (const history of [false, true]) {
        const values = model.response(event, profile, history);
        assert.equal(values.length, 4);
        assert.equal(values.reduce((a, b) => a + b, 0), 100);
        assert.ok(values.every(value => value >= 0 && value <= 100));
      }
      assert.deepEqual(model.response(event, profile, false), reference, 'history removed must ignore selected profile');
    }
  }
  const result = model.response('beat', 0, true);
  result[0] = 0;
  assert.equal(model.response('beat', 0, true)[0], 58, 'consumer mutation cannot change source fixtures');
  assert.throws(() => model.response('missing', 0, true), RangeError);
  assert.throws(() => model.response('beat', 1.5, true), RangeError);
});

test('Table 5 intervals preserve reported significance without claiming a measured time series', () => {
  for (const study of Object.values(model.studies)) {
    assert.ok(model.interval(study.early, study.earlySE)[0] > 0);
    const late = model.interval(study.late, study.lateSE);
    assert.ok(late[0] < 0 && late[1] > 0);
  }
  assert.deepEqual(model.interval(49.6, 15.9).map(v => v.toFixed(1)), ['18.4', '80.8']);
  assert.deepEqual(model.interval(-8.3, 11.9).map(v => v.toFixed(1)), ['-31.6', '15.0']);
});

test('context expires at its deadline and invalid clock inputs fail closed', () => {
  assert.equal(model.contextStatus(250, 1000), 'fresh');
  assert.equal(model.contextStatus(999, 1000), 'fresh');
  assert.equal(model.contextStatus(1000, 1000), 'expired');
  assert.equal(model.contextStatus(1500, 1000), 'expired');
  for (const age of [-1, NaN, Infinity, undefined, '250']) assert.equal(model.contextStatus(age, 1000), 'expired');
  for (const ttl of [-1, 0, NaN, Infinity, undefined]) assert.equal(model.contextStatus(250, ttl), 'expired');
});

function assertClose(actual, expected, message) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-10,
    `${message}: expected ${expected}, received ${actual}`);
}

function assertDistribution(actual, expected, message) {
  assert.equal(actual.length, expected.length, message);
  actual.forEach((value, index) => assertClose(value, expected[index], `${message}, outcome ${index}`));
}

test('population uses cohort headcounts, not an unweighted mean or a selected profile', () => {
  // A 100-person population contains 70 momentum, 15 confirmation and 15 loss-sensitive people.
  // These expected counts are independently calculated from the published earnings-beat fixtures.
  const result = model.population('beat', 'momentum', true);
  assertDistribution(result.flows[0], [40.6, 14.7, 6.3, 8.4], '70-person momentum cohort');
  assertDistribution(result.flows[1], [1.8, 9, 1.5, 2.7], '15-person confirmation cohort');
  assertDistribution(result.flows[2], [3.3, 6.45, 2.85, 2.4], '15-person loss-sensitive cohort');
  assertDistribution(result.totals, [45.7, 30.15, 10.65, 13.5], 'aggregate expected counts');
  assertClose(result.tilt, 35.05, 'add-minus-reduce headcount imbalance');
  assertDistribution(model.population('cut', 'defensive', true).totals,
    [5.6, 26.9, 53.7, 13.8], 'loss-sensitive population after a guidance cut');
  assertClose(model.population('beat', 'balanced', true).tilt, 18, 'balanced population imbalance');
});

test('population flows conserve all cohort mass and all 100 people, including missing choices', () => {
  for (const event of Object.keys(model.events)) {
    for (const [mix, composition] of Object.entries(model.mixes)) {
      assertClose(composition.weights.reduce((sum, weight) => sum + weight, 0), 1, `${mix} composition`);
      for (const history of [false, true]) {
        const result = model.population(event, mix, history);
        const context = `${event}/${mix}/history=${history}`;
        assert.equal(result.flows.length, model.profiles.length, context);
        assert.equal(result.totals.length, model.actions.length, context);
        result.flows.forEach((row, profile) => {
          assert.equal(row.length, model.actions.length, context);
          assert.ok(row.every(value => Number.isFinite(value) && value >= 0), context);
          assertClose(row.reduce((sum, value) => sum + value, 0), composition.weights[profile] * 100,
            `${context} source cohort ${profile}`);
        });
        result.totals.forEach((value, action) => {
          assert.ok(value >= 0 && value <= 100, context);
          assertClose(result.flows.reduce((sum, row) => sum + row[action], 0), value,
            `${context} destination outcome ${action}`);
        });
        assertClose(result.totals.reduce((sum, value) => sum + value, 0), 100, `${context} total people`);
        assert.ok(result.totals[3] > 0, `${context} must retain the missing-choice category`);
        assertClose(result.tilt, result.totals[0] - result.totals[2], `${context} headcount imbalance`);
      }
    }
  }
});

test('removing history makes aggregate forecasts composition-invariant without erasing cohort sizes', () => {
  for (const event of Object.keys(model.events)) {
    for (const mix of Object.keys(model.mixes)) {
      assertDistribution(model.population(event, mix, false).totals, model.events[event].base,
        `${event}/${mix} event-only aggregate`);
    }
  }
  const momentumOnlyEvent = model.population('beat', 'momentum', false);
  const defensiveOnlyEvent = model.population('beat', 'defensive', false);
  assertDistribution(momentumOnlyEvent.flows[0], [24.5, 24.5, 10.5, 10.5], '70 people with a shared forecast');
  assertDistribution(defensiveOnlyEvent.flows[0], [5.25, 5.25, 2.25, 2.25], '15 people with the same forecast');
  assertClose(momentumOnlyEvent.tilt, 20, 'event-only imbalance');
  const momentumHistory = model.population('beat', 'momentum', true);
  const defensiveHistory = model.population('beat', 'defensive', true);
  assert.ok(momentumHistory.totals[0] > defensiveHistory.totals[0], 'composition affects add choices when history is present');
  assert.ok(momentumHistory.tilt > defensiveHistory.tilt, 'history exposes the composition-dependent imbalance');
  assert.notDeepEqual(momentumHistory.totals, momentumOnlyEvent.totals, 'history toggle changes the aggregate distribution');
  momentumHistory.flows[0][0] = 0;
  momentumHistory.totals[0] = 0;
  assertClose(model.population('beat', 'momentum', true).totals[0], 45.7, 'returned arrays do not mutate future forecasts');
});

test('population rejects unknown, inherited and non-string identifiers with explicit range errors', () => {
  const invalidIds = ['missing', '', 'constructor', 'toString', '__proto__', null, undefined, -1, {}, ['beat']];
  for (const id of invalidIds) {
    assert.throws(() => model.population(id, 'balanced', true), RangeError, `invalid event ${String(id)}`);
    assert.throws(() => model.population('beat', id, true), RangeError, `invalid mix ${String(id)}`);
  }
  assert.throws(() => model.population('beat', ['balanced'], false), RangeError, 'array cannot masquerade as a valid mix');
});

test('a simulated buy pays for ten shares at the selected market price and the next step uses the new ledger', () => {
  const initial = Object.freeze({ shares: 100, cash: 5000 });
  assert.equal(model.decision('beat', 0, initial, true), 'add');
  const first = model.step('beat', 0, initial, true);
  assert.deepEqual(first, { shares: 110, cash: 3960, action: 'add' });
  const second = model.step('beat', 0, first, true);
  assert.deepEqual(second, { shares: 120, cash: 2920, action: 'add' });
  assert.deepEqual(model.step('beat', 0, second, true), { shares: 130, cash: 1880, action: 'add' });
  assert.deepEqual(model.step('mixed', 0, initial, true), { shares: 110, cash: 4010, action: 'add' },
    'the mixed-event fixture fills at $99, not the $104 earnings-beat price');
  assert.deepEqual(initial, { shares: 100, cash: 5000 });
});

test('a simulated sale removes ten held shares and credits the full stated proceeds', () => {
  const initial = Object.freeze({ shares: 100, cash: 5000 });
  assert.equal(model.decision('cut', 2, initial, true), 'reduce');
  const first = model.step('cut', 2, initial, true);
  assert.deepEqual(first, { shares: 90, cash: 5940, action: 'reduce' });
  assert.deepEqual(model.step('cut', 2, first, true), { shares: 80, cash: 6880, action: 'reduce' });
  assert.deepEqual(model.step('mixed', 2, initial, true), { shares: 90, cash: 5990, action: 'reduce' });
  assert.deepEqual(initial, { shares: 100, cash: 5000 });
});

test('keeping a position leaves both balances unchanged and returns an independent ledger', () => {
  const initial = Object.freeze({ shares: 100, cash: 5000 });
  assert.equal(model.decision('beat', 1, initial, true), 'hold');
  const result = model.step('beat', 1, initial, true);
  assert.deepEqual(result, { shares: 100, cash: 5000, action: 'hold' });
  assert.notEqual(result, initial);
  result.cash = 0;
  result.shares = 0;
  assert.deepEqual(initial, { shares: 100, cash: 5000 });
  assert.deepEqual(model.step('beat', 1, initial, true), { shares: 100, cash: 5000, action: 'hold' });
});

test('fixed-lot buys stop before overdrawing cash, including at the exact affordability boundary', () => {
  const underfunded = Object.freeze({ shares: 100, cash: 1039.99 });
  assert.equal(model.decision('beat', 0, underfunded, true), 'hold');
  assert.deepEqual(model.step('beat', 0, underfunded, true), { shares: 100, cash: 1039.99, action: 'hold' });
  const fullySpent = model.step('beat', 0, { shares: 100, cash: 1040 }, true);
  assert.deepEqual(fullySpent, { shares: 110, cash: 0, action: 'add' });
  assert.deepEqual(model.step('beat', 0, fullySpent, true), { shares: 110, cash: 0, action: 'hold' });
  let ledger = { shares: 100, cash: 5000 };
  for (let i = 0; i < 4; i += 1) ledger = model.step('beat', 0, ledger, true);
  assert.deepEqual(ledger, { shares: 140, cash: 840, action: 'add' });
  assert.deepEqual(model.step('beat', 0, ledger, true), { shares: 140, cash: 840, action: 'hold' });
});

test('fixed-lot sales cannot create a short position or turn a partial holding into a full fill', () => {
  for (const shares of [0, 9]) {
    const initial = Object.freeze({ shares, cash: 5000 });
    assert.equal(model.decision('cut', 2, initial, true), 'hold');
    assert.deepEqual(model.step('cut', 2, initial, true), { shares, cash: 5000, action: 'hold' });
  }
  const soldOut = model.step('cut', 2, { shares: 10, cash: 5000 }, true);
  assert.deepEqual(soldOut, { shares: 0, cash: 5940, action: 'reduce' });
  assert.deepEqual(model.step('cut', 2, soldOut, true), { shares: 0, cash: 5940, action: 'hold' });
});

test('invalid simulated balances are rejected before a decision or transition', () => {
  const invalid = [
    null, undefined, {}, [], 'ledger',
    { shares: 100 }, { cash: 5000 },
    { shares: 100, cash: -0.01 }, { shares: 100, cash: NaN },
    { shares: 100, cash: Infinity }, { shares: 100, cash: '5000' },
    { shares: -1, cash: 5000 }, { shares: 1.5, cash: 5000 },
    { shares: NaN, cash: 5000 }, { shares: Infinity, cash: 5000 },
    { shares: '100', cash: 5000 }
  ];
  for (const ledger of invalid) {
    assert.throws(() => model.decision('beat', 0, ledger, true), RangeError);
    assert.throws(() => model.step('beat', 0, ledger, true), RangeError);
  }
  assert.deepEqual(model.step('beat', 0, { shares: 0, cash: 0 }, true),
    { shares: 0, cash: 0, action: 'hold' }, 'zero balances are valid, constrained states');
});

test('all authored ledger paths preserve marked value at the fixed fill price and keep observations unchanged', () => {
  const observedHistory = JSON.stringify(model.profiles);
  for (const event of Object.keys(model.events)) {
    for (let profile = 0; profile < model.profiles.length; profile += 1) {
      for (const history of [false, true]) {
        const initial = Object.freeze({ shares: 100, cash: 5000 });
        const result = model.step(event, profile, initial, history);
        const price = model.markets[event].price;
        assertClose(result.cash + result.shares * price, 5000 + 100 * price,
          `${event}/${profile}/${history}: a zero-cost fixed-price fill conserves marked value`);
        assert.deepEqual(initial, { shares: 100, cash: 5000 });
        assert.ok(result.cash >= 0 && result.shares >= 0);
      }
    }
  }
  assert.equal(JSON.stringify(model.profiles), observedHistory,
    'simulated steps must not append to or rewrite the observed-history fixtures');
});
