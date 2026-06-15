/* =========================================================
   BACKER — THESIS DECK · interactions
   Vanilla JS, no dependencies, no build step.
   Every interaction clarifies the thesis. Reduced-motion safe.
   ========================================================= */
(function () {
  'use strict';

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAS_IO = 'IntersectionObserver' in window;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Graceful degradation: if IntersectionObserver is unavailable (very old
  // browsers), shim it so every observer immediately reports "intersecting."
  // Nothing is ever left stuck invisible, and no observer call throws.
  if (!HAS_IO) {
    window.IntersectionObserver = function (cb) {
      this.observe = function (el) { setTimeout(function () { cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }]); }, 0); };
      this.unobserve = function () {};
      this.disconnect = function () {};
    };
  }

  var chapters = $$('.chapter');
  var topbar = $('#topbar');
  var scanBar = $('#scanBar');
  var rail = $('#rail');
  var counterNow = $('#counterNow');

  /* ---------- topbar scrolled + scan progress ---------- */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (topbar) topbar.classList.toggle('scrolled', y > 40);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, y / max) : 0;
    if (scanBar) scanBar.style.width = (p * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- chapter rail ---------- */
  var railDots = [];
  chapters.forEach(function (ch, i) {
    var dot = document.createElement('button');
    dot.className = 'rail-dot';
    dot.setAttribute('aria-label', 'Go to chapter ' + (i + 1) + ': ' + (ch.dataset.label || ''));
    dot.innerHTML = '<span class="rd-label">' + (ch.dataset.label || ('Chapter ' + (i + 1))) + '</span><span class="rd-mark"></span>';
    dot.addEventListener('click', function () { scrollToChapter(i); });
    rail.appendChild(dot);
    railDots.push(dot);
  });

  var navLinks = $$('.topnav a');
  var current = 0;
  function setActive(i) {
    if (i === current) return;
    current = i;
    railDots.forEach(function (d, k) { d.classList.toggle('active', k === i); });
    if (counterNow) counterNow.textContent = ('0' + (i + 1)).slice(-2);
    // topnav active mapping by jump index
    navLinks.forEach(function (a) {
      var j = parseInt(a.dataset.jump, 10);
      a.classList.toggle('active', j === i ||
        (i >= 2 && i <= 3 && j === 2) ||
        (i >= 5 && i <= 6 && j === 4) ||
        (i === 8 && j === 7));
    });
  }

  /* ---------- active-chapter observer ---------- */
  var activeObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var i = chapters.indexOf(e.target);
        if (i > -1) setActive(i);
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  chapters.forEach(function (ch) { activeObs.observe(ch); });

  /* ---------- reveal observer ---------- */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('.reveal').forEach(function (el) { revealObs.observe(el); });

  /* ---------- navigation helpers ---------- */
  function scrollToChapter(i) {
    i = Math.max(0, Math.min(chapters.length - 1, i));
    chapters[i].scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }
  $$('[data-jump]').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      var j = parseInt(el.dataset.jump, 10);
      if (!isNaN(j)) { ev.preventDefault(); scrollToChapter(j); }
    });
  });

  /* ---------- deck mode (snap) ---------- */
  var deckToggle = $('#deckModeToggle');
  if (deckToggle) {
    deckToggle.addEventListener('click', function () {
      var on = document.body.classList.toggle('deck-snap');
      deckToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* ---------- keyboard navigation ---------- */
  document.addEventListener('keydown', function (e) {
    if (memoOpen) {
      if (e.key === 'Escape') closeMemo();
      return;
    }
    var t = e.target;
    var tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var handled = false;
    switch (e.key) {
      case 'ArrowDown': case 'PageDown':
        scrollToChapter(current + 1); handled = true; break;
      case 'ArrowUp': case 'PageUp':
        scrollToChapter(current - 1); handled = true; break;
      case 'Home':
        scrollToChapter(0); handled = true; break;
      case 'End':
        scrollToChapter(chapters.length - 1); handled = true; break;
      case ' ':
        if (tag !== 'BUTTON' && tag !== 'A') { scrollToChapter(current + (e.shiftKey ? -1 : 1)); handled = true; }
        break;
    }
    if (handled) e.preventDefault();
  });

  /* =========================================================
     CHAPTER 1 — ticker
  ========================================================= */
  (function ticker() {
    var track = $('#tickerTrack');
    if (!track) return;
    var items = [
      ['ATTN.IDX', '1,284.6', 'up', '+0.84%'],
      ['POA-BAND', 'A2', 'amb', 'stable'],
      ['BELIEF/USD', '0.0412', 'up', '+2.1%'],
      ['RETN.30', '71.4', 'up', '▲'],
      ['REACH', 'vanity', 'dn', 'noise'],
      ['SIGNAL', 'verified', 'up', '✓'],
      ['ANOMALY', '3 flags', 'dn', '▼'],
      ['DEPTH.q', '0.66', 'amb', '~'],
      ['TRAJ', 'compounding', 'up', '▲'],
      ['MANUF.ATTN', 'discount', 'dn', '▼'],
      ['CONF', '0.78', 'amb', '~'],
      ['EARLY', 'unpriced', 'up', '○']
    ];
    function build() {
      return items.map(function (it) {
        var cls = it[2] === 'up' ? 'ti-up' : it[2] === 'dn' ? 'ti-dn' : 'ti-amb';
        return '<span class="ticker-item"><span class="ti-sym">' + it[0] + '</span>' +
               '<span class="ti-val">' + it[1] + '</span>' +
               '<span class="' + cls + '">' + it[3] + '</span></span>';
      }).join('');
    }
    track.innerHTML = build() + build(); // duplicate for seamless loop
  })();

  /* =========================================================
     CHAPTER 2 — era slider
  ========================================================= */
  (function era() {
    var slider = $('#eraSlider');
    var visual = $('#eraVisual');
    var marks = $$('.era-mark');
    if (!slider || !visual) return;
    var labels = ['hands', 'machines', 'desks', 'allocation'];
    function set(v) {
      v = parseInt(v, 10);
      visual.setAttribute('data-era', v);
      slider.value = v;
      slider.style.setProperty('--fill', (v / 3 * 100) + '%');
      slider.setAttribute('aria-valuetext', labels[v]);
      marks.forEach(function (m, k) { m.classList.toggle('is-on', k === v); });
    }
    slider.addEventListener('input', function () { set(slider.value); });
    marks.forEach(function (m) {
      m.addEventListener('click', function () { set(m.dataset.eraSet); });
    });
    set(0);
  })();

  /* =========================================================
     CHAPTER 3 — AI switch
  ========================================================= */
  (function aiSwitch() {
    var sw = $('#aiSwitch');
    var machine = $('#machine');
    var label = $('#aiSwitchLabel');
    var bar = $('.machine-bar');
    if (!sw || !machine) return;
    sw.addEventListener('click', function () {
      var on = machine.getAttribute('data-ai') !== 'on';
      machine.setAttribute('data-ai', on ? 'on' : 'off');
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      if (label) label.textContent = on ? 'AI is on' : 'Turn on AI';
      if (bar) bar.classList.toggle('ai-on', on);
    });
  })();

  /* =========================================================
     CHAPTER 5 — market wall (tap to expand on touch) + opener
  ========================================================= */
  (function wall() {
    $$('[data-tile]').forEach(function (tile) {
      tile.addEventListener('click', function () {
        var open = tile.getAttribute('aria-expanded') === 'true';
        $$('[data-tile]').forEach(function (t) { if (t !== tile) t.setAttribute('aria-expanded', 'false'); });
        tile.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
    var opener = $('#opener');
    if (opener) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { setTimeout(function () { opener.classList.add('open'); }, RM ? 0 : 500); obs.disconnect(); }
        });
      }, { threshold: 0.3 });
      obs.observe($('#wall'));
    }
  })();

  /* =========================================================
     CHAPTER 6 — attention exchange
  ========================================================= */
  (function exchange() {
    var ex = $('#exchange');
    var pulse = $('#pulse');
    if (!ex) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          ex.classList.add('lit');
          if (pulse && !RM) pulse.classList.add('grow');
          obs.disconnect();
        }
      });
    }, { threshold: 0.35 });
    obs.observe(ex);
  })();

  /* =========================================================
     CHAPTER 7 — constellation of online IP
  ========================================================= */
  (function constellation() {
    var nodesEl = $('#constNodes');
    var linksEl = $('#constLinks');
    var card = $('#ipcard');
    if (!nodesEl || !linksEl) return;

    // center = AI tools; IP types radiate outward
    var IP = [
      ['founder-led media', 'audience trusts the operator behind the brand', 'a media company around one point of view', 'reach inflated by one viral moment', 'borrowed audiences, rented virality'],
      ['AI educator', 'they make a hard domain legible', 'evergreen demand for clarity', 'engagement that never converts to retention', 'recycled explainers, thin authority'],
      ['musician', 'fans believe in a sound before the world hears it', 'catalog + cultural half-life', 'streams bought to fake momentum', 'playlist placement, not real listeners'],
      ['fitness creator', 'results and consistency build trust', 'high-retention routine + community', 'before/after spikes with no durability', 'transformation farms, fake testimonials'],
      ['beauty operator', 'taste signals a product line', 'audience becomes a brand balance sheet', 'sponsor-driven reach masking churn', 'engagement pods, comment rings'],
      ['niche researcher', 'depth earns a small, loyal audience', 'authority compounds quietly', 'small numbers read as no signal', 'citations gamed, credentials hollow'],
      ['indie hacker', 'building in public earns conviction', 'shipping cadence becomes track record', 'launch-day reach, no second act', 'vanity MRR, staged momentum'],
      ['game streamer', 'community shows up live, repeatedly', 'session depth + concurrency', 'view-botting and host raids', 'inflated concurrents, hollow chat'],
      ['local expert', 'real-world credibility travels online', 'a defensible regional moat', 'reach that does not localize', 'fake locality, geo-spoofed followers'],
      ['one-person company', 'one human is the product and the brand', 'leverage compounds with reputation', 'mispriced because it looks small', 'persona without a real operator'],
      ['digital artist', 'a style fans recognize on sight', 'a body of work that appreciates', 'hype cycles detached from depth', 'plagiarized style, borrowed clout']
    ];

    // layout: two rings around center
    var center = { x: 50, y: 50 };
    var positions = [];
    var ring1 = 6, ring2 = IP.length - ring1;
    for (var i = 0; i < ring1; i++) {
      var a = (i / ring1) * Math.PI * 2 - Math.PI / 2;
      positions.push({ x: 50 + Math.cos(a) * 26, y: 50 + Math.sin(a) * 30 });
    }
    for (var j = 0; j < ring2; j++) {
      var a2 = (j / ring2) * Math.PI * 2 - Math.PI / 2 + Math.PI / ring2;
      positions.push({ x: 50 + Math.cos(a2) * 43, y: 50 + Math.sin(a2) * 46 });
    }

    // center node (AI tools)
    var coreNode = document.createElement('div');
    coreNode.className = 'const-node sel';
    coreNode.style.left = center.x + '%';
    coreNode.style.top = center.y + '%';
    coreNode.setAttribute('aria-hidden', 'true');
    coreNode.innerHTML = '<span class="cn-dot cn-core"></span><span class="cn-label" style="opacity:1">AI tools</span>';
    nodesEl.appendChild(coreNode);

    var W = 1000, H = 560;
    IP.forEach(function (ip, k) {
      var p = positions[k];
      var node = document.createElement('button');
      node.className = 'const-node';
      node.style.left = p.x + '%';
      node.style.top = p.y + '%';
      node.setAttribute('aria-label', 'Inspect ' + ip[0]);
      node.innerHTML = '<span class="cn-dot"></span><span class="cn-label">' + ip[0] + '</span>';
      node.addEventListener('click', function () {
        $$('.const-node').forEach(function (n) { if (n !== coreNode) n.classList.remove('sel'); });
        node.classList.add('sel');
        openCard(ip);
        // light the link
        var lines = $$('line', linksEl);
        lines.forEach(function (ln, li) { ln.classList.toggle('lit', li === k); });
      });
      nodesEl.appendChild(node);

      // link from center to node
      var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', center.x / 100 * W);
      ln.setAttribute('y1', center.y / 100 * H);
      ln.setAttribute('x2', p.x / 100 * W);
      ln.setAttribute('y2', p.y / 100 * H);
      linksEl.appendChild(ln);
    });

    function openCard(ip) {
      if (!card) return;
      $('#ipcardKind').textContent = 'online IP';
      $('#ipcardTitle').textContent = ip[0];
      $('#ipcardRows').innerHTML =
        row('believe', 'what the audience believes', ip[1]) +
        row('compound', 'what could compound', ip[2]) +
        row('mispriced', 'what could be mispriced', ip[3]) +
        row('fake', 'what could be fake', ip[4]);
      card.hidden = false;
    }
    function row(tone, k, v) {
      return '<div class="ipc-row" data-tone="' + tone + '"><span class="ipc-k">' + k + '</span><span class="ipc-v">' + v + '</span></div>';
    }
    var close = $('#ipcardClose');
    if (close) close.addEventListener('click', function () { card.hidden = true; $$('.const-node').forEach(function (n) { if (n !== coreNode) n.classList.remove('sel'); }); });
  })();

  /* =========================================================
     CHAPTER 8 — trust problem (metric wall glitch + PoA)
  ========================================================= */
  (function trust() {
    var wallEl = $('#metricwall');
    var poa = $('#poa');
    if (wallEl) {
      var metrics = [
        ['followers', '482,119'], ['views', '12.4M'], ['likes', '906K'],
        ['comments', '41,228'], ['impressions', '88.7M'], ['growth', '+312%'],
        ['reposts', '74,510'], ['saves', '210K'], ['watch-time', '1.9M hrs'], ['ER', '9.7%']
      ];
      var ghosts = ['??,???', '0', '∞', 'NULL', '—', 'bot', '×3', 'dupe'];
      wallEl.innerHTML = metrics.map(function (m) {
        var g = ghosts[Math.floor(Math.random() * ghosts.length)];
        return '<span class="metric"><span class="m-k">' + m[0] + '</span><span class="m-v" data-ghost="' + g + '">' + m[1] + '</span></span>';
      }).join('');

      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          obs.disconnect();
          if (RM) {
            // static: mark a few as anomalies without animation
            $$('.metric', wallEl).slice(0, 3).forEach(function (m) { m.style.borderColor = 'rgba(255,111,107,.4)'; m.style.color = 'var(--neg)'; });
            return;
          }
          var chips = $$('.metric', wallEl);
          // stagger the corruption
          chips.forEach(function (chip, i) {
            setTimeout(function () {
              if (Math.random() > 0.35) chip.classList.add('glitch');
            }, 700 + i * 140);
          });
        });
      }, { threshold: 0.4 });
      obs.observe(wallEl);
    }

    if (poa) {
      // assign meter widths conceptually
      var bands = { authenticity: 84, durability: 71, anomaly: 28, depth: 66, trajectory: 79, confidence: 78 };
      $$('.band', poa).forEach(function (b) {
        var k = b.dataset.band;
        var fill = b.querySelector('i');
        if (fill) fill.style.setProperty('--w', (bands[k] || 70) + '%');
        if (fill) fill.parentElement.style.setProperty('--w', (bands[k] || 70) + '%');
      });
      var obs2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { poa.classList.add('lit'); obs2.disconnect(); } });
      }, { threshold: 0.3 });
      obs2.observe(poa);
    }
  })();

  /* =========================================================
     CHAPTER 9 — architecture step sequence
  ========================================================= */
  (function arch() {
    var arch = $('#arch');
    if (!arch) return;
    var steps = $$('.arch-step', arch);
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.disconnect();
        if (RM) { steps.forEach(function (s) { s.classList.add('lit'); }); return; }
        steps.forEach(function (s, i) { setTimeout(function () { s.classList.add('lit'); }, 350 + i * 320); });
      });
    }, { threshold: 0.35 });
    obs.observe(arch);
  })();

  /* =========================================================
     CHAPTER 10 — flywheel node placement + spin
  ========================================================= */
  (function flywheel() {
    var fly = $('#flywheel');
    if (!fly) return;
    var nodes = $$('.fly-nodes li', fly);
    function place() {
      var size = fly.clientWidth;
      var r = size * 0.42;
      var cx = size / 2, cy = size / 2;
      nodes.forEach(function (li) {
        var ang = (parseFloat(li.style.getPropertyValue('--a')) - 90) * Math.PI / 180;
        var x = cx + Math.cos(ang) * r;
        var y = cy + Math.sin(ang) * r;
        li.style.left = x + 'px';
        li.style.top = y + 'px';
        li.style.transform = 'translate(-50%,-50%)';
      });
    }
    place();
    window.addEventListener('resize', place);
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { if (!RM) fly.classList.add('spin'); else { var arc = $('.fly-arc', fly); if (arc) arc.style.strokeDashoffset = '0'; } obs.disconnect(); } });
    }, { threshold: 0.3 });
    obs.observe(fly);
  })();

  /* =========================================================
     MEMO OVERLAY
  ========================================================= */
  var memo = $('#memoOverlay');
  var memoOpen = false;
  var lastFocus = null;
  function openMemo() {
    if (!memo) return;
    lastFocus = document.activeElement;
    memo.hidden = false; memoOpen = true;
    var x = $('#memoClose'); if (x) x.focus();
  }
  function closeMemo() {
    if (!memo) return;
    memo.hidden = true; memoOpen = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-memo]').forEach(function (b) { b.addEventListener('click', openMemo); });
  var memoX = $('#memoClose');
  if (memoX) memoX.addEventListener('click', closeMemo);
  if (memo) memo.addEventListener('click', function (e) { if (e.target === memo) closeMemo(); });
  var memoMail = $('#memoMail');
  if (memoMail) memoMail.setAttribute('href', 'mailto:?subject=' + encodeURIComponent('Backer — request the memo') + '&body=' + encodeURIComponent('I’d like the Backer category brief and underwriting thesis.'));

  /* ---------- init ---------- */
  onScroll();
  setActive(0);
})();
