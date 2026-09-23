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
      { date: 'T − 90d', event: 'Management raises guidance.', action: 'Added 20 shares', context: 'Bought 40 minutes after the release, with cash available.' },
      { date: 'T − 45d', event: 'Earnings exceed expectations.', action: 'Added 15 shares', context: 'Bought in the same session, then trimmed three days later.' },
      { date: 'T − 12d', event: 'Sales outlook deteriorates.', action: 'Reduced 25 shares', context: 'Reduced before the earnings call, while the broad market was stable.' }
    ],
    [
      { date: 'T − 90d', event: 'Management raises guidance.', action: 'Held the position', context: 'Waited for the earnings call before adding two sessions later.' },
      { date: 'T − 45d', event: 'Margins weaken despite revenue growth.', action: 'Held the position', context: 'Kept the position while waiting for more detail on costs.' },
      { date: 'T − 12d', event: 'Sales outlook deteriorates.', action: 'Reduced 10 shares', context: 'Reduced after management clarified the cause.' }
    ],
    [
      { date: 'T − 90d', event: 'Management raises guidance.', action: 'Held the position', context: 'Kept exposure at the planned allocation despite the positive update.' },
      { date: 'T − 45d', event: 'A price decline follows a weaker outlook.', action: 'Reduced 20 shares', context: 'Reduced within 15 minutes of the update.' },
      { date: 'T − 12d', event: 'Sales outlook deteriorates.', action: 'Reduced 30 shares', context: 'Cut exposure again while retaining cash for later decisions.' }
    ]
  ];
  profiles.forEach(function (profile, i) { profile.id = ['Trader 014', 'Trader 028', 'Trader 063'][i]; profile.records = histories[i]; });
  var markets = {
    beat: { price: 104, context: 'Shares trade at $104 after a positive earnings surprise.', choices: ['add', 'hold', 'hold'] },
    cut: { price: 94, context: 'Shares trade at $94 after management cuts its outlook.', choices: ['reduce', 'hold', 'reduce'] },
    mixed: { price: 99, context: 'Shares trade at $99 as revenue growth and margin pressure conflict.', choices: ['add', 'hold', 'reduce'] }
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
  return { studies: studies, markets: markets, decision: decision, step: step, events: events, profiles: profiles, actions: actions, mixes: mixes, interval: interval, response: response, population: population, contextStatus: contextStatus };
}));
