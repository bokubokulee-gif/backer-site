/* Authored teaching fixtures. No trained inference, trading signals or price model. */
(function (root, factory) {
  'use strict';
  var model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.BackerHftModel = model;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var studies = {
    fh: { label: 'Fung–Hsieh', early: 49.6, late: -8.3, earlySE: 15.9, lateSE: 11.9 },
    aqr: { label: 'AQR', early: 48.8, late: -2.9, earlySE: 22.4, lateSE: 12.0 }
  };
  var events = {
    beat: { label: 'Earnings beat', detail: 'Revenue beats expectations. Management raises its outlook.', base: [35, 35, 15, 15], responses: [[58, 21, 9, 12], [12, 60, 10, 18], [22, 43, 19, 16]] },
    cut: { label: 'Guidance cut', detail: 'Current earnings hold up. Management cuts its outlook.', base: [8, 32, 43, 17], responses: [[10, 32, 46, 12], [4, 40, 32, 24], [5, 23, 60, 12]] },
    mixed: { label: 'Mixed announcement', detail: 'Revenue grows. Margins narrow and the outlook is unchanged.', base: [22, 41, 19, 18], responses: [[34, 35, 16, 15], [8, 53, 14, 25], [13, 37, 32, 18]] }
  };
  var profiles = [
    { label: 'Follows momentum', history: 'Previously added after upward revisions; often acted within one session.', reading: 'This pattern acts on revisions quickly. Positive and negative updates can both trigger a change in exposure.' },
    { label: 'Waits for confirmation', history: 'Previously held through announcements and waited for a second signal.', reading: 'This pattern waits for corroboration. Attention to an event does not immediately become a trade.' },
    { label: 'Cuts losses early', history: 'Previously reduced exposure quickly when new information weakened the original thesis.', reading: 'This pattern protects the original thesis. Deteriorating information prompts a faster reduction in exposure.' }
  ];
  var histories = [
    [
      { date: 'T − 90d', event: 'Management raises guidance.', action: 'Added 20 shares', change: 20, context: 'Bought 40 minutes after the release, with cash available.' },
      { date: 'T − 45d', event: 'Earnings exceed expectations.', action: 'Added 15 shares', change: 15, context: 'Bought in the same session, then trimmed three days later.' },
      { date: 'T − 12d', event: 'Sales outlook deteriorates.', action: 'Reduced 25 shares', change: -25, context: 'Reduced before the earnings call, while the broad market was stable.' }
    ],
    [
      { date: 'T − 90d', event: 'Management raises guidance.', action: 'Held the position', change: 0, context: 'Waited for the earnings call before adding two sessions later.' },
      { date: 'T − 45d', event: 'Margins weaken despite revenue growth.', action: 'Held the position', change: 0, context: 'Kept the position while waiting for more detail on costs.' },
      { date: 'T − 12d', event: 'Sales outlook deteriorates.', action: 'Reduced 10 shares', change: -10, context: 'Reduced after management clarified the cause.' }
    ],
    [
      { date: 'T − 90d', event: 'Management raises guidance.', action: 'Held the position', change: 0, context: 'Kept exposure at the planned allocation despite the positive update.' },
      { date: 'T − 45d', event: 'A price decline follows a weaker outlook.', action: 'Reduced 20 shares', change: -20, context: 'Reduced within 15 minutes of the update.' },
      { date: 'T − 12d', event: 'Sales outlook deteriorates.', action: 'Reduced 30 shares', change: -30, context: 'Cut exposure again while retaining cash for later decisions.' }
    ]
  ];
  profiles.forEach(function (profile, i) { profile.id = ['Trader 014', 'Trader 028', 'Trader 063'][i]; profile.records = histories[i]; });
  var markets = {
    beat: { price: 104, context: 'Shares trade at $104 after a positive earnings surprise.', choices: ['add', 'hold', 'hold'] },
    cut: { price: 94, context: 'Shares trade at $94 after management cuts its outlook.', choices: ['reduce', 'hold', 'reduce'] },
    mixed: { price: 99, context: 'Shares trade at $99 as revenue growth and margin pressure conflict.', choices: ['add', 'hold', 'reduce'] }
  };
  // Separate authored Choice fixtures: add, hold, reduce. Not observation categories.
  var heroEvents = {
    beat: { base: [36, 45, 19], responses: [[62, 27, 11], [15, 73, 12], [24, 58, 18]] },
    cut: { base: [12, 38, 50], responses: [[12, 33, 55], [7, 52, 41], [7, 21, 72]] },
    mixed: { base: [25, 49, 26], responses: [[45, 38, 17], [12, 66, 22], [18, 34, 48]] }
  };
  var actions = ['Add', 'Hold', 'Reduce', 'No recorded choice'];
  var mixes = {
    balanced: { label: 'Balanced', weights: [1 / 3, 1 / 3, 1 / 3] },
    momentum: { label: 'Momentum heavy', weights: [0.7, 0.15, 0.15] },
    defensive: { label: 'Loss sensitive', weights: [0.15, 0.15, 0.7] }
  };
  function interval(value, se) { return [value - 1.96 * se, value + 1.96 * se]; }
  function response(eventId, profileId, useHistory) {
    if (typeof eventId !== 'string' || !Object.prototype.hasOwnProperty.call(events, eventId) || !Number.isInteger(profileId) || !profiles[profileId]) throw new RangeError('Unknown scenario');
    return (useHistory ? events[eventId].responses[profileId] : events[eventId].base).slice();
  }
  function heroResponse(eventId, profileId, useHistory) {
    response(eventId, profileId, useHistory);
    return (useHistory ? heroEvents[eventId].responses[profileId] : heroEvents[eventId].base).slice();
  }
  function heroProjection(eventId, actionIndex) {
    response(eventId, 0, false);
    if (!Number.isInteger(actionIndex) || actionIndex < 0 || actionIndex > 2) throw new RangeError('Unknown hero action');
    // Reader-selected what-if from a fixed starting account, not an executed prediction.
    var change = [10, 0, -10][actionIndex];
    return { shares: 100 + change, cash: 5000 - change * markets[eventId].price };
  }
  function contextStatus(age, ttl) {
    return Number.isFinite(age) && age >= 0 && Number.isFinite(ttl) && ttl > 0 && age < ttl ? 'fresh' : 'expired';
  }
  function decision(eventId, profileId, ledger, useHistory) {
    response(eventId, profileId, useHistory);
    if (!ledger || !Number.isFinite(ledger.cash) || ledger.cash < 0 || !Number.isInteger(ledger.shares) || ledger.shares < 0) throw new RangeError('Invalid simulated ledger');
    var market = markets[eventId];
    // Authored teaching choices, never represented as live model output.
    var action = useHistory ? market.choices[profileId] : (eventId === 'cut' ? 'reduce' : 'hold');
    if (action === 'add' && ledger.cash < market.price * 10) action = 'hold';
    if (action === 'reduce' && ledger.shares < 10) action = 'hold';
    return action;
  }
  function step(eventId, profileId, ledger, useHistory) {
    var action = decision(eventId, profileId, ledger, useHistory);
    var shares = action === 'add' ? 10 : action === 'reduce' ? -10 : 0;
    return { shares: ledger.shares + shares, cash: ledger.cash - shares * markets[eventId].price, action: action };
  }
  function population(eventId, mixId, useHistory) {
    if (typeof mixId !== 'string' || !Object.prototype.hasOwnProperty.call(mixes, mixId)) throw new RangeError('Unknown population');
    var flows = mixes[mixId].weights.map(function (weight, profile) {
      return response(eventId, profile, useHistory).map(function (probability) { return weight * probability; });
    });
    var totals = actions.map(function (_, action) { return flows.reduce(function (sum, row) { return sum + row[action]; }, 0); });
    return { flows: flows, totals: totals, tilt: totals[0] - totals[2] };
  }

  // Fund choices are separate from the participant whose behavior is modeled.
  // These paths are reader-selected assumptions, never inferred from a Choice.
  var fundPaths = {
    rebound: [1, 0.990, 0.985, 0.997, 1.010, 1.024, 1.030],
    fall: [1, 0.992, 0.986, 0.978, 0.969, 0.958, 0.950],
    flat: [1, 1.002, 0.999, 1.001, 0.998, 1.002, 1]
  };
  var fundDepths = {
    normal: { spread: 0.20, availableShares: 10 },
    thin: { spread: 0.80, availableShares: 3 }
  };
  var choiceIds = ['hold', 'add', 'reduce', 'abstain'];
  function rounded(value) { return Number(value.toFixed(6)); }
  function knownKey(value, table) {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(table, value);
  }
  function plainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      && [Object.prototype, null].indexOf(Object.getPrototypeOf(value)) !== -1;
  }
  function exactKeys(value, keys) {
    return plainObject(value) && Object.keys(value).length === keys.length
      && keys.every(function (key) { return Object.prototype.hasOwnProperty.call(value, key); });
  }
  function validateFixtureSelection(input) {
    if (!exactKeys(input, ['eventId', 'profileId', 'historyIncluded'])
      || !knownKey(input.eventId, events) || !Number.isInteger(input.profileId)
      || input.profileId < 0 || input.profileId >= profiles.length
      || typeof input.historyIncluded !== 'boolean') throw new TypeError('Invalid synthetic selection');
    return { eventId: input.eventId, profileId: input.profileId, historyIncluded: input.historyIncluded };
  }
  function compareAlternatives(eventId, pathId, depthId) {
    if (pathId === undefined) pathId = 'rebound';
    if (depthId === undefined) depthId = 'normal';
    if (!knownKey(eventId, markets) || !knownKey(pathId, fundPaths) || !knownKey(depthId, fundDepths)) {
      throw new RangeError('Unknown fund comparison fixture');
    }
    var initial = { shares: 100, cash: 5000, mark: markets[eventId].price };
    initial.value = initial.cash + initial.shares * initial.mark;
    var depth = fundDepths[depthId];
    var assumptions = { orderCap: 10, spread: depth.spread, feeRate: 0.001,
      availableShares: depth.availableShares, steps: fundPaths[pathId].length - 1 };
    var path = fundPaths[pathId].map(function (relative) { return Number((initial.mark * relative).toFixed(2)); });
    var finalMark = path[path.length - 1];
    var holdValue = initial.cash + initial.shares * finalMark;
    var branches = ['add', 'hold', 'reduce'].map(function (id) {
      var requested = id === 'hold' ? 0 : assumptions.orderCap;
      var fillPrice = id === 'hold' ? null : rounded(initial.mark + (id === 'add' ? 1 : -1) * assumptions.spread / 2);
      var capacity = id === 'add' ? Math.floor(initial.cash / (fillPrice * (1 + assumptions.feeRate))) : initial.shares;
      var filled = Math.min(requested, assumptions.availableShares, capacity);
      var notional = filled * (fillPrice || 0);
      var fee = rounded(notional * assumptions.feeRate);
      var cash = rounded(initial.cash + (id === 'add' ? -notional : notional) - fee);
      var shares = initial.shares + (id === 'add' ? filled : -filled);
      if (cash < 0 || shares < 0) throw new RangeError('Synthetic fund constraint violated');
      // Point zero precedes the one initial trade; later points mark its holdings.
      var points = path.map(function (mark, index) { return index === 0 ? initial.value : rounded(cash + shares * mark); });
      var finalValue = points[points.length - 1];
      return { id: id, requestedShares: requested, filledShares: filled, unfilledShares: requested - filled,
        fillPrice: fillPrice, spreadCost: rounded(filled * assumptions.spread / 2), fee: fee,
        cash: cash, shares: shares, postTradeValue: rounded(cash + shares * initial.mark), points: points,
        finalMark: finalMark, finalValue: finalValue, pnl: rounded(finalValue - initial.value),
        incrementalVsHold: rounded(finalValue - holdValue) };
    });
    return { eventId: eventId, pathId: pathId, depthId: depthId, synthetic: true,
      initial: initial, path: path, assumptions: assumptions, branches: branches };
  }

  /** Canonical English fixture state only. No future path, outcomes or client text. */
  function buildJudgmentState(input) {
    var selection = validateFixtureSelection(input);
    var event = events[selection.eventId];
    var records = selection.historyIncluded ? histories[selection.profileId].map(function (record) {
      return { relativeTime: record.date, event: record.event, action: record.action,
        shareChange: record.change, context: record.context };
    }) : [];
    return {
      evidence: 'Authored synthetic records and market context. No observed person, live price or validated behavioral forecast.',
      instrument: 'Fictional company shares; amounts are illustrative US dollars.',
      behavioralHistory: { status: selection.historyIncluded ? 'included' : 'withheld', records: records },
      holdings: { shares: 100, cash: 5000 },
      situationalContext: { eventId: selection.eventId, event: event.label, detail: event.detail,
        marketMark: markets[selection.eventId].price, marketDescription: markets[selection.eventId].context,
        decisionHorizon: 'The next decision within one synthetic session.' },
      constraints: { noShortSelling: true, noBorrowing: true, maximumOrderShares: 10 }
    };
  }

  /** Validate structure and provenance; schema validity is not behavioral accuracy. */
  function validateJudgment(input) {
    if (!exactKeys(input, ['type', 'choice', 'probabilities', 'confidence', 'source', 'model'])
      || input.type !== 'choice' || choiceIds.indexOf(input.choice) === -1
      || !exactKeys(input.probabilities, choiceIds) || typeof input.confidence !== 'number'
      || !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1
      || !((input.source === 'fixture' && input.model === 'fixture-v1')
        || (input.source === 'jev' && input.model === 'jev-1.13.0'))) throw new TypeError('Invalid Choice judgment');
    var values = choiceIds.map(function (id) { return input.probabilities[id]; });
    if (values.some(function (value) { return typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1; })
      || Math.abs(values.reduce(function (sum, value) { return sum + value; }, 0) - 1) > 0.000001
      || input.probabilities[input.choice] < Math.max.apply(Math, values) - 1e-12) throw new TypeError('Invalid Choice distribution');
    return { type: 'choice', choice: input.choice,
      probabilities: { hold: input.probabilities.hold, add: input.probabilities.add,
        reduce: input.probabilities.reduce, abstain: input.probabilities.abstain },
      confidence: input.confidence, source: input.source, model: input.model };
  }
  function fixtureJudgment(input) {
    var selection = validateFixtureSelection(input);
    var values = heroResponse(selection.eventId, selection.profileId, selection.historyIncluded);
    var probabilities = { hold: values[1] / 100, add: values[0] / 100, reduce: values[2] / 100, abstain: 0 };
    var choice = choiceIds.reduce(function (best, id) { return probabilities[id] > probabilities[best] ? id : best; }, 'hold');
    // A displayed fixture concentration statistic, not a cached Jev answer or accuracy estimate.
    var confidence = Math.max(0, (4 * probabilities[choice] - 1) / 3);
    return validateJudgment({ type: 'choice', choice: choice, probabilities: probabilities,
      confidence: confidence, source: 'fixture', model: 'fixture-v1' });
  }
  return { studies: studies, markets: markets, decision: decision, step: step, events: events, profiles: profiles, actions: actions, mixes: mixes, interval: interval, response: response, heroResponse: heroResponse, heroProjection: heroProjection, population: population, contextStatus: contextStatus,
    compareAlternatives: compareAlternatives, buildJudgmentState: buildJudgmentState,
    validateJudgment: validateJudgment, fixtureJudgment: fixtureJudgment };
}));
