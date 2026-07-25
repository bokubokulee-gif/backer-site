/* Backer market community
   Seeded, market-specific discussion and activity fixtures for the dedicated
   market route. User-authored demo posts persist for the browser session only. */
(function () {
  'use strict';
  if (window.BackerMarketCommunity) return;

  var SESSION_SEED_KEY = 'backer_market_community_seed_v1';
  var SESSION_POSTS_KEY = 'backer_market_community_posts_v1';
  var states = Object.create(null);

  var AUTHORS = [
    { user: 'cutoffmerchant', hue: 31 },
    { user: 'chartlurker', hue: 213 },
    { user: 'viewsarepricedin', hue: 152 },
    { user: 'tinyspread', hue: 278 },
    { user: 'notfinancialadvice', hue: 8 },
    { user: 'uploadcadence', hue: 191 },
    { user: 'lefttailrisk', hue: 344 },
    { user: 'threecentsedge', hue: 82 },
    { user: 'latewindow', hue: 229 },
    { user: 'candlecollector', hue: 44 },
    { user: 'quietliquidity', hue: 173 },
    { user: 'base_rate_betty', hue: 312 },
    { user: 'tabhoarder', hue: 112 },
    { user: 'thesispending', hue: 257 },
    { user: 'feedrefresh', hue: 15 },
    { user: 'probabilitypigeon', hue: 203 },
    { user: 'settlementreader', hue: 62 },
    { user: 'marginalviewer', hue: 291 },
    { user: 'signalnoise', hue: 137 },
    { user: 'openinterest', hue: 229 }
  ];

  var TIMES_OPEN = ['4m', '11m', '19m', '31m', '48m', '1h', '2h', '3h', '5h', '8h'];
  var TIMES_CLOSED = ['2d', '3d', '4d', '6d', '1w', '2w', '3w'];
  var AMOUNTS = [5, 8, 12, 18, 25, 40, 65, 90, 125, 180, 260, 420, 750];

  function hashSeed(value) {
    var text = String(value == null ? 'backer' : value);
    var hash = 2166136261 >>> 0;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      var value = Math.imul(seed ^ seed >>> 15, 1 | seed);
      value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function sessionSeed() {
    try {
      var stored = sessionStorage.getItem(SESSION_SEED_KEY);
      if (stored) return stored;
      var token;
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        var words = new Uint32Array(2);
        window.crypto.getRandomValues(words);
        token = words[0].toString(36) + words[1].toString(36);
      } else {
        token = String(Date.now());
      }
      sessionStorage.setItem(SESSION_SEED_KEY, token);
      return token;
    } catch (error) {
      return String(Date.now());
    }
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function shuffle(items, random) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var held = copy[i];
      copy[i] = copy[j];
      copy[j] = held;
    }
    return copy;
  }

  function pick(items, random) {
    return items[Math.floor(random() * items.length)];
  }

  function compact(value, fallback) {
    var clean = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return clean || fallback || '';
  }

  function firstName(value) {
    return compact(value, 'this creator').split(/\s+/)[0];
  }

  function parseOutcomes(value) {
    try {
      var parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) && parsed.length ? parsed.map(String) : ['YES', 'NO'];
    } catch (error) {
      return ['YES', 'NO'];
    }
  }

  function parsePrices(value) {
    try {
      var parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch (error) {
      return [];
    }
  }

  function readContext(slot) {
    return {
      key: compact(slot.dataset.marketKey, 'market'),
      marketId: compact(slot.dataset.marketId, 'market'),
      creator: compact(slot.dataset.creator, 'This creator'),
      handle: compact(slot.dataset.handle, ''),
      question: compact(slot.dataset.question, 'Will this market resolve YES?'),
      instrument: compact(slot.dataset.instrument, 'milestone'),
      outcomes: parseOutcomes(slot.dataset.outcomes),
      outcomePrices: parsePrices(slot.dataset.outcomePrices),
      selectedOutcome: compact(slot.dataset.selectedOutcome, 'YES'),
      currentPrice: Number(slot.dataset.currentPrice || 0),
      deadline: compact(slot.dataset.deadline, 'the cutoff'),
      target: compact(slot.dataset.target, 'the rule-defined target'),
      source: compact(slot.dataset.source, 'the settlement source'),
      status: compact(slot.dataset.marketStatus, 'OPEN'),
      isOpen: slot.dataset.marketOpen === 'true',
      hasHistory: slot.dataset.hasHistory !== 'false'
    };
  }

  function initials(user) {
    var parts = String(user).replace(/[^a-z0-9]+/gi, ' ').trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return String(user).replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || 'B';
  }

  function priceLabel(context, value) {
    var price = Number(value == null ? context.currentPrice : value);
    if (!isFinite(price) || price <= 0) return context.instrument === 'perps' ? 'the current mark' : 'this price';
    return context.instrument === 'perps' ? price.toFixed(1) : Math.round(price) + '¢';
  }

  function shortSource(context) {
    var source = context.source.replace(/\s+(public|snapshot|data).*$/i, '').trim();
    return source.length > 44 ? 'the named source' : source;
  }

  function discussionBank(context) {
    var creator = firstName(context.creator);
    var price = priceLabel(context);
    var target = context.target;
    var deadline = context.deadline;
    var source = shortSource(context);

    if (context.instrument === 'pk') {
      var lead = context.outcomes[0] || context.selectedOutcome;
      var rival = context.outcomes[1] || 'the field';
      return [
        price + ' on ' + lead + ' feels a little rich. good story, but the upload window is doing most of the work here.',
        'This is basically a distribution bet dressed up as a content bet. Whoever gets the first clean push probably takes the whole window.',
        'am I missing something on the tie outcome? everybody is modeling ' + lead + ' vs ' + rival + ' like the third bucket cannot happen.',
        'Small position on ' + rival + '. Not because I love it, mostly because the spread between the top two looks too confident.',
        'I agree with the ranking and still hate the price lol',
        'The first 24h matters more than the final view count imo. Once one side gets momentum the recommendation loops stop being independent.',
        'No position yet. Does ' + source + ' treat collabs the same way as channel-native uploads?',
        'People keep comparing audience size. I care more about overlap — if both posts hit the same viewers, the second upload gets kneecapped.',
        'The obvious outcome is priced like an inevitability. That is usually where I stop clicking buy.',
        creator + ' has the stronger base rate, but this window is short enough for noise to win. 60/40 maybe, not a lock.',
        'FWIW the tie is not dead. One delayed upload and the “easy” two-way trade gets weird fast.',
        'There is a real edge in reading the exact measurement window. The timeline chatter is mostly vibes.'
      ];
    }

    if (context.instrument === 'perps') {
      return [
        'The mark at ' + price + ' is doing a lot of work. I want to see the next two releases hold before calling this a trend.',
        'funding says the long is crowded but not absurd yet. watching the next reset.',
        'I like ' + creator + ' long term. That does not automatically make this a good long at this mark.',
        'This thing trades like every green candle confirms the thesis and every red candle is “noise” 😭',
        'Small short as a hedge. The attention index can be right and the entry can still be bad.',
        'What is the actual catalyst from here? The recent spike is already on the chart.',
        'Open interest up while the index stalls is the part I cannot ignore.',
        'ngl I was bullish lower. At ' + price + ' I am just watching other people discover leverage.',
        'The clean trade was before the move. Chasing now means you need acceleration, not just decent numbers.',
        'Countertrend long here. Momentum cooled without the underlying cadence breaking.',
        'Everyone is debating direction; basis is the better tell right now.',
        'No position. I need one more data point because this mark is mostly expectations.'
      ];
    }

    return [
      price + ' feels rich unless ' + creator + ' gets a very clean run into ' + deadline + '.',
      'people are trading the creator. I am trading the cutoff. those are not the same bet.',
      'I lean YES, but the next upload gap is basically the whole bet imo.',
      'Everyone is watching the headline count. Cadence is the cleaner signal here.',
      'what am I missing? The target is ' + target + ' and the market is acting like there is no messy middle.',
      'Small NO position. I can like the channel and still think this price is ahead of the evidence.',
      'At a lower price I would buy it. Here I agree with the take and hate the trade.',
      'Does ' + source + ' update quickly enough near cutoff, or are people hand-waving the source latency?',
      'The last spike matters less than whether the baseline held after it. One viral post cannot do all the lifting.',
      creator + ' does not need a moonshot, just normal cadence through ' + deadline + '. That is the bullish case.',
      'thin book + one medium order = “the market knows something” apparently',
      'No position yet. I want to see whether the next release converts into repeat viewers.',
      'The base rate says YES. The resolution wording is what keeps me from sizing up.',
      '17¢ felt free until I actually read the settlement rules.',
      'If the next update lands flat, this reprices way faster than people expect.',
      'Probably priced in, but not fully. Helpful analysis, I know.'
    ];
  }

  function replyBank(context) {
    var price = priceLabel(context);
    if (context.instrument === 'perps') {
      return [
        'yeah, direction can be right and the entry can still be awful',
        'fair. I am watching basis more than the candles here.',
        'counterpoint: funding is still cheap relative to the move.',
        'one more print and I would agree. right now it is a tiny sample.',
        'same thesis, smaller size. leverage makes people forget the downside exists.',
        'the catalyst is already priced at ' + price + ' imo'
      ];
    }
    if (context.instrument === 'pk') {
      return [
        'fair, but that assumes the uploads hit separate audiences.',
        'yeah. the tie is cheap until one delay makes it very real.',
        'I had the same read and still took the other side at this price.',
        'source timing is the part nobody wants to talk about.',
        'small sample though — basically one window deciding the story.',
        'agree on the ranking, disagree on the gap.'
      ];
    }
    return [
      'fair, but that sample is only three uploads.',
      'yeah, lower I would agree. not chasing it at ' + price + '.',
      'the cutoff wording changed my mind too.',
      'counterpoint: the normal cadence is already enough if it holds.',
      'exactly. good creator does not automatically mean good price.',
      'source latency is my only real concern here.',
      'I think the market is underweighting the boring base case.',
      'one flat week and this whole thread looks different.'
    ];
  }

  function positionLabel(context, index, random) {
    if (random() < 0.28) return '';
    var outcome = context.outcomes[index % context.outcomes.length] || context.selectedOutcome;
    if (context.instrument === 'perps') return outcome === 'Short' ? 'Short' : 'Long';
    return outcome;
  }

  function inferredPosition(context, text, index, random) {
    var lower = String(text).toLowerCase();
    if (/no position|just watching|want to see|what am i missing|am i missing|does .* update|actual catalyst/.test(lower)) return '';

    if (context.instrument === 'perps') {
      if (/small short|short as a hedge|crowded long|bearish/.test(lower)) return 'Short';
      if (/countertrend long|bullish|long term|small long/.test(lower)) return 'Long';
      return positionLabel(context, index, random);
    }

    if (context.instrument === 'pk') {
      for (var i = 0; i < context.outcomes.length; i++) {
        if (lower.indexOf(String(context.outcomes[i]).toLowerCase()) >= 0 && /position on|took|backing|tie/.test(lower)) {
          return context.outcomes[i];
        }
      }
      return positionLabel(context, index, random);
    }

    if (/small no|lean no|the bearish case/.test(lower)) return context.outcomes[1] || 'NO';
    if (/lean yes|base rate says yes|bullish case|normal cadence is already enough/.test(lower)) return context.outcomes[0] || 'YES';
    if (/at a lower price i would buy/.test(lower)) return '';
    return positionLabel(context, index, random);
  }

  function buildComments(context, random) {
    var authors = shuffle(AUTHORS, random);
    var lines = shuffle(discussionBank(context), random).slice(0, 8);
    var replies = shuffle(replyBank(context), random);
    var times = context.isOpen ? TIMES_OPEN : TIMES_CLOSED;
    var comments = lines.map(function (text, index) {
      var author = authors[index];
      var nested = [];
      if (index === 1 || index === 3 || (index === 5 && random() > 0.45)) {
        var replyAuthor = authors[8 + nested.length + index % 3];
        nested.push({
          id: context.key + '-r-' + index,
          author: replyAuthor,
          time: times[Math.min(times.length - 1, index + 1)],
          text: replies[index % replies.length],
          likes: Math.floor(random() * 5)
        });
      }
      return {
        id: context.key + '-c-' + index,
        author: author,
        time: times[Math.min(times.length - 1, index)],
        text: text,
        position: inferredPosition(context, text, index + (random() > 0.5 ? 1 : 0), random),
        likes: index === 2 ? 12 + Math.floor(random() * 12) : Math.floor(random() * 8),
        liked: false,
        replies: nested,
        sequence: index
      };
    });
    return comments;
  }

  function activityOutcome(context, index, random) {
    if (!context.outcomes.length) return context.instrument === 'perps' ? 'Long' : 'YES';
    var bias = random() < 0.58 ? 0 : Math.floor(random() * context.outcomes.length);
    return context.outcomes[(bias + (index % 3 === 0 ? 1 : 0)) % context.outcomes.length];
  }

  function activityPrice(context, outcome, random) {
    var outcomeIndex = context.outcomes.indexOf(outcome);
    var base = context.outcomePrices[outcomeIndex] || context.currentPrice || (context.instrument === 'perps' ? 100 : 50);
    if (!context.outcomePrices[outcomeIndex] && context.instrument !== 'perps' && outcome !== context.selectedOutcome && context.outcomes.length === 2) {
      base = 100 - base;
    }
    var spread = context.instrument === 'perps' ? 4.5 : 7;
    var value = Math.max(context.instrument === 'perps' ? 1 : 2, base + (random() - 0.5) * spread);
    if (context.instrument !== 'perps') value = Math.min(98, value);
    return Math.round(value * 10) / 10;
  }

  function buildActivity(context, random) {
    if (!context.hasHistory) return [];
    var authors = shuffle(AUTHORS, random);
    var times = context.isOpen ? TIMES_OPEN : TIMES_CLOSED;
    var rows = [];
    for (var i = 0; i < 16; i++) {
      var outcome = activityOutcome(context, i, random);
      var buy = random() > 0.42;
      var amount = pick(AMOUNTS, random);
      var price = activityPrice(context, outcome, random);
      var units = context.instrument === 'perps'
        ? Math.max(0.01, amount / Math.max(price, 1))
        : Math.max(0.1, amount / Math.max(price / 100, 0.01));
      rows.push({
        id: context.key + '-a-' + i,
        author: authors[i % authors.length],
        time: times[Math.min(times.length - 1, Math.floor(i / 2))],
        buy: buy,
        outcome: outcome,
        amount: amount,
        price: price,
        units: Math.round(units * 100) / 100
      });
    }
    return rows;
  }

  function loadPosts() {
    try {
      var value = JSON.parse(sessionStorage.getItem(SESSION_POSTS_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (error) {
      return {};
    }
  }

  function savePosts(key, posts) {
    try {
      var stored = loadPosts();
      stored[key] = posts.slice(0, 12).map(function (post) {
        return { id: post.id, text: post.text, position: post.position, created: post.created };
      });
      sessionStorage.setItem(SESSION_POSTS_KEY, JSON.stringify(stored));
    } catch (error) {}
  }

  function userPosts(context) {
    var records = loadPosts()[context.key] || [];
    return records.map(function (post, index) {
      return {
        id: post.id || context.key + '-you-' + index,
        author: { user: 'you', hue: 34 },
        time: 'now',
        text: compact(post.text, ''),
        position: compact(post.position, ''),
        likes: 0,
        liked: false,
        replies: [],
        sequence: -100 - index,
        local: true,
        created: post.created || Date.now()
      };
    }).filter(function (post) { return post.text; });
  }

  function buildState(context) {
    var random = mulberry32(hashSeed(sessionSeed() + ':' + context.key));
    return {
      key: context.key,
      context: context,
      activeTab: 'community',
      sort: 'top',
      minAmount: 0,
      expanded: false,
      draft: '',
      draftPosition: '',
      comments: userPosts(context).concat(buildComments(context, random)),
      activity: buildActivity(context, random)
    };
  }

  function stateFor(context) {
    if (!states[context.key]) states[context.key] = buildState(context);
    states[context.key].context = context;
    return states[context.key];
  }

  function avatar(author, sizeClass) {
    return '<span class="bmc-avatar ' + (sizeClass || '') + '" style="--bmc-avatar-hue:' + author.hue + '" aria-hidden="true">'
      + esc(initials(author.user)) + '</span>';
  }

  function positionClass(context, position) {
    if (!position) return '';
    var normalized = String(position).toLowerCase();
    if (normalized === 'no' || normalized === 'short' || context.outcomes.indexOf(position) === 1) return ' is-negative';
    if (context.outcomes.indexOf(position) > 1) return ' is-neutral';
    return ' is-positive';
  }

  function commentActions(comment) {
    return '<div class="bmc-comment-actions">'
      + '<button type="button" class="' + (comment.liked ? 'is-on' : '') + '" data-bmc-like="' + esc(comment.id) + '" aria-pressed="' + comment.liked + '" aria-label="' + (comment.liked ? 'Remove like' : 'Like') + '">'
      + '<span aria-hidden="true">♡</span><span>' + (comment.likes || '') + '</span></button>'
      + '<button type="button" data-bmc-reply="' + esc(comment.id) + '" data-bmc-author="' + esc(comment.author.user) + '" aria-label="Reply to ' + esc(comment.author.user) + '"><span aria-hidden="true">↩</span><span>Reply</span></button>'
      + '</div>';
  }

  function renderReply(reply) {
    return '<div class="bmc-reply" id="' + esc(reply.id) + '">'
      + avatar(reply.author, 'is-small')
      + '<div class="bmc-reply-body"><div class="bmc-comment-meta"><strong>' + esc(reply.author.user) + '</strong><span class="bmc-relative-time">' + esc(reply.time) + '</span></div>'
      + '<p>' + esc(reply.text) + '</p>'
      + '<span class="bmc-reply-like">' + reply.likes + ' like' + (reply.likes === 1 ? '' : 's') + '</span></div></div>';
  }

  function renderComment(context, comment) {
    var position = comment.position
      ? '<span class="bmc-position' + positionClass(context, comment.position) + '">' + esc(comment.position) + '</span>'
      : '';
    return '<article class="bmc-comment" id="' + esc(comment.id) + '">'
      + avatar(comment.author)
      + '<div class="bmc-comment-body"><div class="bmc-comment-meta"><strong>' + esc(comment.author.user) + '</strong>'
      + (comment.local ? '<span class="bmc-local">Local</span>' : '')
      + '<span class="bmc-relative-time">' + esc(comment.time) + '</span>' + position + '</div>'
      + '<p>' + esc(comment.text) + '</p>'
      + commentActions(comment)
      + (comment.replies && comment.replies.length ? '<div class="bmc-replies">' + comment.replies.map(renderReply).join('') + '</div>' : '')
      + '</div></article>';
  }

  function sortedComments(state) {
    var copy = state.comments.slice();
    if (state.sort === 'recent') {
      return copy.sort(function (a, b) { return a.sequence - b.sequence; });
    }
    return copy.sort(function (a, b) {
      if (a.local !== b.local) return a.local ? -1 : 1;
      return b.likes - a.likes;
    });
  }

  function composerOptions(context, selected) {
    var values = context.outcomes.slice();
    return '<option value=""' + (!selected ? ' selected' : '') + '>No position</option>' + values.map(function (outcome) {
      return '<option value="' + esc(outcome) + '"' + (selected === outcome ? ' selected' : '') + '>' + (context.instrument === 'perps' ? esc(outcome) : 'Backing ' + esc(outcome)) + '</option>';
    }).join('');
  }

  function renderCommunity(state) {
    var context = state.context;
    var all = sortedComments(state);
    var visible = state.expanded ? all : all.slice(0, 5);
    var more = all.length > visible.length
      ? '<button type="button" class="bmc-show-more" data-bmc-more>Show ' + (all.length - visible.length) + ' more comments</button>'
      : '';
    return '<div class="bmc-community-panel">'
      + '<form class="bmc-composer" data-bmc-compose>'
      + '<label class="bmc-sr" for="bmcComposer-' + esc(hashSeed(state.key)) + '">Share your take</label>'
      + '<textarea id="bmcComposer-' + esc(hashSeed(state.key)) + '" name="comment" maxlength="500" placeholder="What’s your read on this market?" data-bmc-textarea>' + esc(state.draft) + '</textarea>'
      + '<div class="bmc-composer-bar"><span class="bmc-count" data-bmc-count>' + state.draft.length + ' / 500</span>'
      + '<select name="position" aria-label="Attach a market position" data-bmc-position>' + composerOptions(context, state.draftPosition) + '</select>'
      + '<button type="submit"' + (state.draft.trim() ? '' : ' disabled') + ' data-bmc-post>Post</button></div></form>'
      + '<div class="bmc-comments">' + visible.map(function (comment) { return renderComment(context, comment); }).join('') + '</div>'
      + more + '</div>';
  }

  function money(amount) {
    return '$' + Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function renderActivityRow(context, row) {
    var unitLabel = context.instrument === 'perps' ? row.units + ' units' : row.units + ' contracts';
    var price = context.instrument === 'perps' ? row.price.toFixed(1) + ' index' : row.price + '¢';
    return '<div class="bmc-activity-row" id="' + esc(row.id) + '" data-activity-outcome="' + esc(row.outcome) + '" data-activity-price="' + esc(row.price) + '">'
      + avatar(row.author, 'is-activity')
      + '<div class="bmc-activity-copy"><div class="bmc-activity-meta"><strong>' + esc(row.author.user) + '</strong><span class="bmc-relative-time">' + esc(row.time) + '</span></div>'
      + '<span class="bmc-activity-question">' + esc(context.question) + '</span>'
      + '<div><strong class="' + (row.buy ? 'is-buy' : 'is-sell') + '">' + (row.buy ? 'Bought ' : 'Sold ') + esc(row.outcome) + '</strong>'
      + '<span class="bmc-activity-amount">' + money(row.amount) + ' · ' + esc(unitLabel) + ' @ ' + esc(price) + '</span></div></div></div>';
  }

  function renderActivity(state) {
    var context = state.context;
    if (!context.hasHistory) {
      return '<div class="bmc-empty"><strong>Activity starts when trading opens.</strong><p>This listed market has no executions or quotes yet.</p></div>';
    }
    var filtered = state.activity.filter(function (row) { return row.amount >= state.minAmount; });
    if (!filtered.length) {
      return '<div class="bmc-empty"><strong>No activity at this amount.</strong><p>Choose a lower minimum to see more of the feed.</p></div>';
    }
    return '<div class="bmc-activity-list">' + filtered.map(function (row) {
      return renderActivityRow(context, row);
    }).join('') + '</div>';
  }

  function tools(state) {
    if (state.activeTab === 'activity') {
      return '<label class="bmc-filter"><span>Minimum amount</span><select data-bmc-min>'
        + [[0, 'All activity'], [25, '$25+'], [100, '$100+'], [250, '$250+']].map(function (option) {
          return '<option value="' + option[0] + '"' + (state.minAmount === option[0] ? ' selected' : '') + '>' + option[1] + '</option>';
        }).join('') + '</select></label>';
    }
    return '<label class="bmc-filter"><span>Sort</span><select data-bmc-sort>'
      + '<option value="top"' + (state.sort === 'top' ? ' selected' : '') + '>Top</option>'
      + '<option value="recent"' + (state.sort === 'recent' ? ' selected' : '') + '>Recent</option></select></label>';
  }

  function renderSlot(slot, state) {
    var communityActive = state.activeTab === 'community';
    var panel = communityActive ? renderCommunity(state) : renderActivity(state);
    slot.dataset.bmcMounted = state.key;
    slot.innerHTML = '<div class="bmc-heading"><div class="bmc-tabs" role="tablist" aria-label="Market discussion">'
      + '<button type="button" class="bmc-tab ' + (communityActive ? 'is-active' : '') + '" id="bmcCommunityTab" role="tab" aria-selected="' + communityActive + '" aria-controls="bmcCommunityPanel" tabindex="' + (communityActive ? '0' : '-1') + '" data-bmc-tab="community">Community <span>' + state.comments.length + '</span></button>'
      + '<button type="button" class="bmc-tab ' + (!communityActive ? 'is-active' : '') + '" id="bmcActivityTab" role="tab" aria-selected="' + (!communityActive) + '" aria-controls="bmcCommunityPanel" tabindex="' + (!communityActive ? '0' : '-1') + '" data-bmc-tab="activity">Activity <span>' + state.activity.length + '</span></button>'
      + '</div>' + tools(state) + '</div>'
      + '<div class="bmc-panel" id="bmcCommunityPanel" role="tabpanel" aria-labelledby="' + (communityActive ? 'bmcCommunityTab' : 'bmcActivityTab') + '">' + panel + '</div>'
      + '<div class="bmc-sr" aria-live="polite" data-bmc-live></div>';
  }

  function mount(root) {
    if (!root || !root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll('[data-bmc-slot]'), function (slot) {
      var context = readContext(slot);
      if (slot.dataset.bmcMounted === context.key && slot.querySelector('.bmc-panel')) return;
      var state = stateFor(context);
      slot._bmcState = state;
      renderSlot(slot, state);
    });
  }

  function findSlot(target) {
    return target && target.closest ? target.closest('[data-bmc-slot]') : null;
  }

  function stateFromSlot(slot) {
    if (!slot) return null;
    var context = readContext(slot);
    return slot._bmcState || stateFor(context);
  }

  function findComment(state, id) {
    for (var i = 0; i < state.comments.length; i++) {
      if (state.comments[i].id === id) return state.comments[i];
    }
    return null;
  }

  function announce(slot, message) {
    var live = slot.querySelector('[data-bmc-live]');
    if (live) live.textContent = message;
  }

  function track(eventName, props) {
    try {
      window.dispatchEvent(new CustomEvent('backer:track', { detail: { event: eventName, props: props || {} } }));
      if (window.__backerTrack) window.__backerTrack(eventName, props || {});
    } catch (error) {}
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var slot = findSlot(target);
    if (!slot) return;
    var state = stateFromSlot(slot);
    if (!state) return;

    var tab = target.closest('[data-bmc-tab]');
    if (tab) {
      state.activeTab = tab.dataset.bmcTab;
      renderSlot(slot, state);
      var active = slot.querySelector('[data-bmc-tab="' + state.activeTab + '"]');
      if (active) active.focus();
      track('market_community_tab_changed', { tab: state.activeTab, market_id: state.context.marketId });
      return;
    }

    var more = target.closest('[data-bmc-more]');
    if (more) {
      state.expanded = true;
      renderSlot(slot, state);
      var firstNew = slot.querySelectorAll('.bmc-comment')[5];
      if (firstNew) firstNew.setAttribute('tabindex', '-1'), firstNew.focus();
      return;
    }

    var like = target.closest('[data-bmc-like]');
    if (like) {
      var comment = findComment(state, like.dataset.bmcLike);
      if (!comment) return;
      comment.liked = !comment.liked;
      comment.likes = Math.max(0, comment.likes + (comment.liked ? 1 : -1));
      renderSlot(slot, state);
      var nextLike = Array.prototype.filter.call(slot.querySelectorAll('[data-bmc-like]'), function (button) {
        return button.dataset.bmcLike === comment.id;
      })[0];
      if (nextLike) nextLike.focus();
      announce(slot, comment.liked ? 'Comment liked.' : 'Like removed.');
      return;
    }

    var reply = target.closest('[data-bmc-reply]');
    if (reply) {
      state.activeTab = 'community';
      renderSlot(slot, state);
      var textarea = slot.querySelector('[data-bmc-textarea]');
      if (textarea) {
        textarea.value = '@' + reply.dataset.bmcAuthor + ' ';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
      }
      return;
    }

  });

  document.addEventListener('input', function (event) {
    if (!event.target.matches || !event.target.matches('[data-bmc-textarea]')) return;
    var slot = findSlot(event.target);
    if (!slot) return;
    var state = stateFromSlot(slot);
    state.draft = event.target.value;
    var length = event.target.value.length;
    var count = slot.querySelector('[data-bmc-count]');
    var post = slot.querySelector('[data-bmc-post]');
    if (count) count.textContent = length + ' / 500';
    if (post) post.disabled = !event.target.value.trim();
  });

  document.addEventListener('change', function (event) {
    var slot = findSlot(event.target);
    if (!slot) return;
    var state = stateFromSlot(slot);
    if (!state) return;
    if (event.target.matches('[data-bmc-sort]')) {
      state.sort = event.target.value;
      renderSlot(slot, state);
    } else if (event.target.matches('[data-bmc-min]')) {
      state.minAmount = Number(event.target.value || 0);
      renderSlot(slot, state);
    } else if (event.target.matches('[data-bmc-position]')) {
      state.draftPosition = event.target.value;
    }
  });

  document.addEventListener('keydown', function (event) {
    var tab = event.target.closest && event.target.closest('[data-bmc-tab]');
    if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) >= 0) {
      var slot = findSlot(tab);
      var tabs = Array.prototype.slice.call(slot.querySelectorAll('[data-bmc-tab]'));
      var index = tabs.indexOf(tab);
      if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = tabs.length - 1;
      event.preventDefault();
      tabs[index].click();
      return;
    }
    if (event.target.matches && event.target.matches('[data-bmc-textarea]') && event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (event.target.form && event.target.value.trim()) {
        event.target.form.requestSubmit();
      }
    }
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form.matches || !form.matches('[data-bmc-compose]')) return;
    event.preventDefault();
    var slot = findSlot(form);
    var state = stateFromSlot(slot);
    var data = new FormData(form);
    var text = compact(data.get('comment'), '').slice(0, 500);
    if (!text) return;
    var post = {
      id: state.key + '-you-' + Date.now(),
      author: { user: 'you', hue: 34 },
      time: 'now',
      text: text,
      position: compact(data.get('position'), ''),
      likes: 0,
      liked: false,
      replies: [],
      sequence: -1000 - Date.now(),
      local: true,
      created: Date.now()
    };
    state.comments.unshift(post);
    state.sort = 'recent';
    state.expanded = true;
    state.draft = '';
    state.draftPosition = '';
    savePosts(state.key, state.comments.filter(function (comment) { return comment.local; }));
    renderSlot(slot, state);
    announce(slot, 'Your comment was added to this browser session.');
    var posted = document.getElementById(post.id);
    if (posted) {
      posted.setAttribute('tabindex', '-1');
      posted.focus();
    }
    track('market_community_comment_posted', { market_id: state.context.marketId, instrument: state.context.instrument });
  });

  window.BackerMarketCommunity = { mount: mount };
})();
