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
  function population(eventId, mixId, useHistory) {
    if (typeof mixId !== 'string' || !Object.prototype.hasOwnProperty.call(mixes, mixId)) throw new RangeError('Unknown population');
    var flows = mixes[mixId].weights.map(function (weight, profile) {
      return response(eventId, profile, useHistory).map(function (probability) { return weight * probability; });
    });
    var totals = actions.map(function (_, action) { return flows.reduce(function (sum, row) { return sum + row[action]; }, 0); });
    return { flows: flows, totals: totals, tilt: totals[0] - totals[2] };
  }
  return { studies: studies, events: events, profiles: profiles, actions: actions, mixes: mixes, interval: interval, response: response, population: population, contextStatus: contextStatus };
}));
