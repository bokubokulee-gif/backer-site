'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');

// Public Bilibili discovery is retained by the scheduled acquisition process.
// Request handlers never spawn local tools or reuse a browser session, so the
// live adapter intentionally degrades to the source-backed catalog.
const bilibili = createProviderAdapter({
  id: 'bilibili',
  availability() {
    return { state: 'not_configured', reasonCode: 'provider_not_configured' };
  },
  async fetchPage() {
    return {
      creators: [],
      platformIdentities: [],
      contentRecords: [],
      metricObservations: [],
      nextCursor: null
    };
  }
});

module.exports = { bilibili };
