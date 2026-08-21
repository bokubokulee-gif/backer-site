/* Standalone Portfolio integration for real-subject paper positions. */
(function (root) {
  'use strict';

  var store = root.BackerTradesPositionStore;
  var catalog = null;
  var rootNode = document.getElementById('tradesPortfolio');
  var investor = document.getElementById('investorMode');
  var creator = document.getElementById('creatorMode');
  var tradesButton = document.getElementById('mTrades');
  var legacyButton = document.getElementById('mInvestor');
  var creatorButton = document.getElementById('mCreator');
  if (!rootNode || !store || !investor || !creator || !tradesButton || !legacyButton || !creatorButton) return;

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function array(value) { return Array.isArray(value) ? value : []; }
  function number(value) {
    var parsed = Number(value);
    return value === '' || value == null || !isFinite(parsed) ? null : parsed;
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function money(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(number(value) || 0);
  }
  function signedMoney(value) {
    var parsed = number(value) || 0;
    return (parsed > 0 ? '+' : '') + money(parsed);
  }
  function cents(value) {
    var parsed = number(value) || 0;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(parsed) + '¢';
  }
  function date(value) {
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(parsed);
  }
  function provider(value) {
    var id = clean(value).toLowerCase();
    var labels = { youtube: 'YouTube', github: 'GitHub', instagram: 'Instagram', dev: 'DEV', x: 'X', bilibili: 'Bilibili', linkedin: 'LinkedIn', twitch: 'Twitch', medium: 'Medium', substack: 'Substack', rss: 'RSS', tiktok: 'TikTok', spotify: 'Spotify', soundcloud: 'SoundCloud', patreon: 'Patreon', kick: 'Kick' };
    return labels[id] || id.replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) || 'Public source';
  }
  function initials(value) {
    return clean(value).split(/\s+/).filter(Boolean).slice(0, 2).map(function (word) { return word.charAt(0); }).join('').toUpperCase() || 'B';
  }
  function safeMedia(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var parsed = new URL(raw);
      return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.username && !parsed.password ? parsed.href : '';
    } catch (error) { return ''; }
  }
  function lookup(position) {
    if (!catalog) return null;
    var rows = position.subjectKind === 'profile' ? array(catalog.people) : array(catalog.contents);
    return rows.filter(function (row) { return clean(row.id || row.personId || row.contentId) === position.subjectId; })[0] || null;
  }
  function currentPrice(position) {
    var subject = lookup(position);
    var simulation = subject && subject.simulation;
    var support = number(simulation && simulation.supportPriceCents);
    if (support == null) return position.priceCents;
    return position.side === 'BACK' ? support : 100 - support;
  }
  function summary(positions) {
    return positions.reduce(function (result, position) {
      var price = currentPrice(position);
      var mark = position.quantity * price / 100;
      result.cost += position.cost;
      result.mark += mark;
      result.pnl += mark - position.cost;
      return result;
    }, { cost: 0, mark: 0, pnl: 0 });
  }
  function mediaHTML(position) {
    var snapshot = position.subjectSnapshot;
    var source = safeMedia(position.subjectKind === 'content' ? snapshot.thumbnail : snapshot.avatar);
    var title = snapshot.title || snapshot.name;
    return '<span class="tp-position-media' + (source ? ' has-image' : '') + '">' + (source
      ? '<img src="' + esc(source) + '" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" data-trades-portfolio-media/>'
      : '<span aria-hidden="true">' + esc(initials(title)) + '</span>') + '</span>';
  }
  function discoveryHref(position) {
    var params = new URLSearchParams({ view: 'radar', person: position.personId });
    if (position.contentId) params.set('work', position.contentId);
    return 'backerdemo.html#market2?' + params.toString();
  }
  function positionHTML(position) {
    var snapshot = position.subjectSnapshot;
    var contract = position.contractSnapshot;
    var price = currentPrice(position);
    var mark = position.quantity * price / 100;
    var pnl = mark - position.cost;
    var subjectTitle = position.subjectKind === 'content' ? snapshot.title : snapshot.name;
    var subjectLine = position.subjectKind === 'content' ? snapshot.name + ' · ' + provider(snapshot.provider) : provider(snapshot.provider) + ' profile';
    return '<article class="tp-position" data-position-id="' + esc(position.id) + '">' +
      '<div class="tp-position-subject">' + mediaHTML(position) + '<div><span class="tp-position-kind">' + esc(position.subjectKind === 'content' ? 'Content market' : 'Profile market') + '</span><h3>' + esc(subjectTitle) + '</h3><p>' + esc(subjectLine) + ' · ' + esc(date(position.createdAt)) + '</p></div></div>' +
      '<span class="tp-side is-' + position.side.toLowerCase() + '">' + esc(position.side) + '</span>' +
      '<div class="tp-number"><span>Entry</span><b>' + esc(cents(position.priceCents)) + '</b></div>' +
      '<div class="tp-number"><span>Current model</span><b>' + esc(cents(price)) + '</b></div>' +
      '<div class="tp-number"><span>Cost</span><b>' + esc(money(position.cost)) + '</b></div>' +
      '<div class="tp-number"><span>Mark</span><b>' + esc(money(mark)) + '</b></div>' +
      '<div class="tp-number is-pnl ' + (pnl >= 0 ? 'is-up' : 'is-down') + '"><span>P/L</span><b>' + esc(signedMoney(pnl)) + '</b></div>' +
      '<section class="tp-position-contract"><span>Contract</span><h4>' + esc(contract.question) + '</h4><p>' + esc(contract.baselineLabel) + ' baseline → ' + esc(contract.targetLabel) + ' target · ' + esc(date(contract.cutoff)) + '</p></section>' +
      '<div class="tp-position-links"><a href="' + esc(discoveryHref(position)) + '">Open in Discovery</a><a href="' + esc(snapshot.sourceUrl) + '" target="_blank" rel="noopener noreferrer">View subject source</a><a href="' + esc(contract.metricSourceUrl) + '" target="_blank" rel="noopener noreferrer">Resolution source</a>' + (position.proposalHref ? '<a href="' + esc(position.proposalHref) + '">Draft rules</a>' : '') + '<span>Receipt ' + esc(position.receiptId) + ' · Contract ' + esc(position.contractId) + '</span></div>' +
    '</article>';
  }
  function emptyHTML() {
    return '<div class="tp-empty"><span class="tp-eyebrow">Position ledger</span><h2>No positions yet</h2><p>Back or fade a real profile or source-linked work. The subject, quote, side, quantity, cost, and evidence IDs will stay attached to the receipt.</p><div><a class="btn btn-fill" href="backerdemo.html#trades">Explore Trades</a><a class="btn btn-line" href="backerdemo.html#market2">Open Discovery</a></div></div>';
  }
  function render() {
    var positions = store.list(root.localStorage);
    var account = store.account(root.localStorage);
    var totals = summary(positions);
    var equity = account.cash + totals.mark;
    rootNode.innerHTML = '<div class="tp-head"><div><span class="tp-eyebrow">Real subjects · paper markets</span><h1>Your positions</h1><p>Profiles and work come from the Discovery catalog. Prices and marks come from the current Backer simulation model.</p></div><div class="tp-head-actions"><a class="btn btn-line" href="backerdemo.html#market2">Discovery</a><a class="btn btn-fill" href="backerdemo.html#trades?view=positions">Open Trades</a></div></div>' +
      '<div class="tp-summary"><div><span>Paper equity</span><b>' + esc(money(equity)) + '</b><small>Cash + current marks</small></div><div><span>Available paper cash</span><b>' + esc(money(account.cash)) + '</b><small>Started at ' + esc(money(account.startingCash)) + '</small></div><div><span>Positions mark</span><b>' + esc(money(totals.mark)) + '</b><small>' + positions.length + ' open position' + (positions.length === 1 ? '' : 's') + ' · ' + esc(money(totals.cost)) + ' cost</small></div><div><span>Unrealized P/L</span><b class="' + (totals.pnl >= 0 ? 'is-up' : 'is-down') + '">' + esc(signedMoney(totals.pnl)) + '</b><small>Current Backer model</small></div></div>' +
      (positions.length ? '<div class="tp-ledger-head"><div><span class="tp-eyebrow">Position ledger</span><h2>Open trades</h2></div><span>Newest first</span></div><div class="tp-positions">' + positions.map(positionHTML).join('') + '</div>' : emptyHTML());
  }
  function updateIdentity(mode) {
    var name = document.getElementById('userName');
    var avatar = document.getElementById('userAvatar');
    var meta = document.querySelector('.id-meta');
    var tag = document.querySelector('.disclaimer-bar');
    if (mode === 'trades') {
      if (name) name.textContent = 'Portfolio';
      if (avatar) avatar.textContent = 'B';
      if (meta) meta.innerHTML = '<span>Device-local paper positions</span><span class="sep">·</span><span>Real catalog subjects</span><span class="sep">·</span><span>Modeled market marks</span>';
      if (tag) tag.innerHTML = '<b>Paper portfolio</b> · Real public subjects · Modeled prices and activity';
    } else {
      if (name) name.textContent = 'Cooper';
      if (avatar) avatar.textContent = 'C';
      if (meta) meta.innerHTML = '<span>@endurance</span><span class="sep">·</span><span>Legacy fixture examples</span><span class="sep">·</span><span>Separate demo storage</span>';
      if (tag) tag.innerHTML = '<b>Legacy examples</b> · Fixture positions kept separate from your Trades portfolio';
    }
  }
  function select(mode) {
    var trades = mode === 'trades';
    var legacy = mode === 'legacy';
    rootNode.classList.toggle('hidden', !trades);
    investor.classList.toggle('hidden', !legacy);
    creator.classList.toggle('hidden', mode !== 'creator');
    tradesButton.classList.toggle('is-on', trades);
    legacyButton.classList.toggle('is-on', legacy);
    creatorButton.classList.toggle('is-on', mode === 'creator');
    updateIdentity(mode);
    if (trades) render();
  }
  function route(mode) {
    var url = 'portfolio.html';
    if (mode === 'legacy') url += '?legacy=1';
    if (mode === 'creator') url += '?legacy=1&mode=creator';
    try { history.replaceState(null, '', url); } catch (error) {}
    select(mode);
  }

  tradesButton.addEventListener('click', function () { route('trades'); });
  legacyButton.addEventListener('click', function () { route('legacy'); });
  creatorButton.addEventListener('click', function () { route('creator'); });
  rootNode.addEventListener('error', function (event) {
    if (!event.target.matches || !event.target.matches('[data-trades-portfolio-media]')) return;
    var media = event.target.closest('.tp-position-media');
    if (media) media.innerHTML = '<span aria-hidden="true">B</span>';
  }, true);
  root.addEventListener('storage', function (event) { if (event.key === store.storageKey || event.key === store.accountStorageKey) render(); });

  var params = new URLSearchParams(location.search || '');
  select(params.get('mode') === 'creator' ? 'creator' : params.get('legacy') === '1' ? 'legacy' : 'trades');
  if (root.BackerTradeCatalog && typeof root.BackerTradeCatalog.load === 'function') {
    root.BackerTradeCatalog.load().then(function (value) { catalog = value; render(); }).catch(function () { render(); });
  } else render();
})(window);
