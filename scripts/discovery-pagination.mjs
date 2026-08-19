function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pageKey(items, itemKey) {
  return items.map((item, index) => String(itemKey(item, index) || '')).join('\u001f');
}

function cursorFailureReason(error) {
  const reason = String(error && error.code || '').trim().toLowerCase();
  return [
    'provider_rate_limited',
    'provider_permission_required',
    'provider_timeout',
    'provider_response_invalid'
  ].includes(reason) ? reason : 'partial_page_failure';
}

/**
 * Exhaust an opaque provider cursor until that provider stops returning a
 * next token. This loop deliberately has no Backer-owned page or result cap.
 * A failed request returns the exact token that failed so a later authorized
 * run can resume without claiming that the provider was exhausted.
 */
export async function exhaustCursorPages(options) {
  const fetchPage = options && options.fetchPage;
  const consumePage = options && options.consumePage;
  if (typeof fetchPage !== 'function' || typeof consumePage !== 'function') {
    throw new TypeError('fetchPage and consumePage are required');
  }
  const itemKey = typeof options.itemKey === 'function'
    ? options.itemKey
    : (item) => item && (item.id || item.nativeId || item.url);
  let cursor = options.startCursor == null || options.startCursor === ''
    ? null
    : String(options.startCursor);
  const seenCursors = new Set();
  if (cursor) seenCursors.add(cursor);
  const seenPages = new Set();
  let pagesRead = 0;

  while (true) {
    let payload;
    try {
      payload = await fetchPage(cursor);
    } catch (error) {
      return {
        state: pagesRead > 0 || options.hasLastGood === true ? 'partial' : 'failed',
        hasMore: true,
        reasonCode: cursorFailureReason(error),
        pagesRead,
        nextCursor: cursor,
        error
      };
    }
    const items = Array.isArray(payload && payload.items) ? payload.items
      : Array.isArray(payload) ? payload : [];
    const fingerprint = items.length ? pageKey(items, itemKey) : null;
    if (fingerprint && seenPages.has(fingerprint)) {
      return {
        state: 'partial', hasMore: true, reasonCode: 'provider_pagination_stalled',
        pagesRead, nextCursor: cursor
      };
    }
    if (fingerprint) seenPages.add(fingerprint);
    await consumePage(items, cursor, payload);
    pagesRead += 1;

    const nextCursor = payload && payload.nextCursor != null && payload.nextCursor !== ''
      ? String(payload.nextCursor)
      : null;
    if (!nextCursor) {
      return {
        state: 'succeeded', hasMore: false,
        reasonCode: payload && payload.terminalReason || null,
        pagesRead, nextCursor: null
      };
    }
    if (nextCursor === cursor || seenCursors.has(nextCursor)) {
      return {
        state: 'partial', hasMore: true, reasonCode: 'provider_pagination_stalled',
        pagesRead, nextCursor
      };
    }
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }
}

/**
 * Walk a provider's public pagination until the provider returns its terminal
 * page or its documented anonymous result window is reached. There is no
 * Backer-owned page budget in this loop.
 *
 * A failed request is the only path that emits `partial_page_failure`. The
 * returned nextPage can be committed and supplied on the following run.
 */
export async function exhaustPages(options) {
  const fetchPage = options && options.fetchPage;
  const consumePage = options && options.consumePage;
  if (typeof fetchPage !== 'function' || typeof consumePage !== 'function') {
    throw new TypeError('fetchPage and consumePage are required');
  }
  const startPage = positiveInteger(options.startPage, 1);
  const pageSize = positiveInteger(options.pageSize, 100);
  const providerPageLimit = Number.isSafeInteger(options.providerPageLimit) && options.providerPageLimit > 0
    ? options.providerPageLimit
    : Number.POSITIVE_INFINITY;
  const itemKey = typeof options.itemKey === 'function'
    ? options.itemKey
    : (item) => item && (item.id || item.nativeId || item.url);
  const seenPages = new Set();
  let page = startPage;
  let pagesRead = 0;

  while (page <= providerPageLimit) {
    let payload;
    try {
      payload = await fetchPage(page);
    } catch (error) {
      return {
        state: pagesRead > 0 || options.hasLastGood === true ? 'partial' : 'failed',
        hasMore: true,
        reasonCode: 'partial_page_failure',
        pagesRead,
        nextPage: page,
        error
      };
    }
    const items = Array.isArray(payload && payload.items) ? payload.items
      : Array.isArray(payload) ? payload : [];
    if (items.length === 0) {
      return {
        state: 'succeeded', hasMore: false, reasonCode: payload && payload.terminalReason || null,
        pagesRead, nextPage: null
      };
    }
    const fingerprint = pageKey(items, itemKey);
    if (seenPages.has(fingerprint)) {
      return {
        state: 'partial', hasMore: true, reasonCode: 'provider_pagination_stalled',
        pagesRead, nextPage: page
      };
    }
    seenPages.add(fingerprint);
    await consumePage(items, page, payload);
    pagesRead += 1;
    if (payload && payload.terminal === true) {
      return {
        state: 'succeeded', hasMore: false, reasonCode: payload.terminalReason || null,
        pagesRead, nextPage: null
      };
    }
    if (items.length < pageSize) {
      return {
        state: 'succeeded', hasMore: false, reasonCode: payload && payload.terminalReason || null,
        pagesRead, nextPage: null
      };
    }
    page += 1;
  }

  return {
    state: 'succeeded', hasMore: false, reasonCode: 'api_result_window',
    pagesRead, nextPage: null
  };
}
