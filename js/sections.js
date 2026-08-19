/* =========================================================
   BACKER — marketing sections: validation graphics,
   payout lab, FAQ accordion, mobile nav.
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- count-up numbers ---------------- */
  function fmtInt(v) { return Math.round(v).toLocaleString('en-US'); }
  function runCount(el) {
    const to = parseFloat(el.dataset.to) || 0;
    const dur = parseFloat(el.dataset.dur) || 1200;
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = pre + fmtInt(to) + suf; return; }
    const t0 = performance.now();
    (function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmtInt(to * e) + suf;
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
    // guarantee the final value even if rAF is throttled (battery saver etc.)
    setTimeout(() => { el.textContent = pre + fmtInt(to) + suf; }, dur + 120);
  }
  function initCounters() {
    const els = $$('[data-countup]');
    if (!els.length) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach(en => {
        if (en.isIntersecting) { io.unobserve(en.target); runCount(en.target); }
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  }

  /* ---------------- prediction-market volume bars ---------------- */
  function initValBars() {
    const wrap = $('#valBars');
    if (!wrap) return;
    // endpoints reported (<$5B Sep 2025 → ~$24B Apr 2026); middle months interpolated
    const months = [4.8, 6.8, 9, 11.5, 14, 17, 20.5, 24];
    const max = 24;
    wrap.innerHTML = months.map((v, i) => {
      const label = i === 0 ? '&lt;$5B' : `$${Math.round(v)}B`;
      return `<div class="val-bar" style="--h:${(v / max * 100).toFixed(1)};--i:${i}">` +
        `<span>${label}</span></div>`;
    }).join('');
  }

  /* ---------------- payout lab ---------------- */
  const FEE_POOL = 0.10;           // proposed — TBD
  const state = { scen: 'milestone', side: 'yes', out: 'yes' };
  let lastPayout = 0, payoutRaf = 0, payoutTimer = 0;

  const money = (v, maxFrac) => '$' + (+v).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: maxFrac == null ? 2 : maxFrac
  });
  const num = (id) => {
    const v = parseFloat(($(id) || {}).value);
    return isFinite(v) && v > 0 ? v : 0;
  };

  const L = {
    milestone: {
      sideLab: 'Your side', sideYes: 'YES — it hits', sideNo: 'NO — it misses',
      yesLab: 'Total staked YES', noLab: 'Total staked NO',
      outLab: 'Then the milestone…', outYes: 'Hits ✓', outNo: 'Misses ✕',
      nameYes: 'YES', nameNo: 'NO',
      split: (f) => `Fee ${money(f)} → ${money(f * .6)} Backer revenue · ${money(f * .4)} creator royalty <em>(proposed 60 / 40)</em>`
    },
    pk: {
      sideLab: 'You back', sideYes: 'Creator A', sideNo: 'Creator B',
      yesLab: 'Total on Creator A', noLab: 'Total on Creator B',
      outLab: 'Then the battle…', outYes: 'A wins', outNo: 'B wins',
      nameYes: 'A', nameNo: 'B',
      split: (f) => `Fee ${money(f)} → ${money(f * .6)} Backer revenue · ${money(f * .4)} shared creator royalty <em>(proposed 60 / 40)</em>`
    }
  };

  function animPayout(el, to) {
    cancelAnimationFrame(payoutRaf);
    clearTimeout(payoutTimer);
    const from = lastPayout; lastPayout = to;
    if (reduceMotion) { el.textContent = money(to, 3); return; }
    const t0 = performance.now(), dur = 380;
    (function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = money(from + (to - from) * e, 3);
      if (p < 1) payoutRaf = requestAnimationFrame(frame);
    })(t0);
    // guarantee the final value even if rAF is throttled
    payoutTimer = setTimeout(() => { el.textContent = money(to, 3); }, dur + 120);
  }

  function updateCalc() {
    const isPerp = state.scen === 'perp';
    const payoutNum = $('#payoutNum'), delta = $('#payoutDelta'),
      formula = $('#calcFormula'), split = $('#calcSplit'), insight = $('#calcInsight'),
      poolbar = $('#calcPoolbar'), feeChip = $('#feeChip');
    if (!payoutNum) return;

    if (isPerp) {
      poolbar.style.display = 'none';
      feeChip.textContent = 'fee ~0.5% per trade · proposed';
      const S = num('#pStake'), entry = num('#pEntry'), exit = num('#pExit');
      const f = Math.min(10, Math.max(0, parseFloat(($('#pFee') || {}).value) || 0)) / 100;
      const ok = S > 0 && entry > 0;
      const payout = ok ? S * (exit / entry) * Math.pow(1 - f, 2) : 0;
      animPayout(payoutNum, payout);
      payoutNum.classList.toggle('pos', payout > S);
      payoutNum.classList.toggle('zero', ok && payout < S);
      const idxPct = ok ? (exit / entry - 1) * 100 : 0;
      const retPct = ok && S > 0 ? (payout / S - 1) * 100 : 0;
      delta.textContent = ok ? `index ${idxPct >= 0 ? '+' : ''}${idxPct.toFixed(1)}% → ${retPct >= 0 ? '+' : ''}${retPct.toFixed(1)}% on your ${money(S)}` : 'enter a stake and an entry index';
      delta.className = 'calc-payout-delta ' + (retPct > 0 ? 'pos' : retPct < 0 ? 'neg' : '');
      formula.textContent = ok
        ? `${money(S)} × (${exit} ÷ ${entry}) × ${(1 - f).toFixed(3)}² = ${money(payout, 3)}`
        : 'Payout = Stake × (exit ÷ entry) × (1 − fee)²';
      split.innerHTML = 'Trade fee is charged on entry and exit. No pool — your dollar tracks the index. <em>(rates proposed · TBD)</em>';
      insight.innerHTML = 'A perp is conviction without an expiry date: no milestone, no resolution — just the creator’s verified attention index, <em>up or down.</em>';
      return;
    }

    poolbar.style.display = '';
    feeChip.textContent = 'fee 10% · proposed';
    const lab = L[state.scen];
    // "(incl. yours)" follows whichever side the user picked
    $('#cYesLab').innerHTML = lab.yesLab + (state.side === 'yes' ? ' <em>(incl. yours)</em>' : '');
    $('#cNoLab').innerHTML = lab.noLab + (state.side === 'no' ? ' <em>(incl. yours)</em>' : '');
    const S = num('#cStake');
    let yes = num('#cYes'), no = num('#cNo');
    // your stake lives inside your side's pool
    if (state.side === 'yes') yes = Math.max(yes, S); else no = Math.max(no, S);
    const P = yes + no, fee = P * FEE_POOL, paypool = P - fee;
    const W = state.out === 'yes' ? yes : no;
    const won = state.side === state.out && S > 0;
    const payout = won && W > 0 ? S * paypool / W : 0;

    // pool bar: YES + NO scaled to 90%, fee slice 10%
    const cpYes = $('#cpYes'), cpNo = $('#cpNo'), cpFee = $('#cpFee'), cpYou = $('#cpYou');
    if (P > 0) {
      cpYes.style.width = (yes / P * (1 - FEE_POOL) * 100) + '%';
      cpNo.style.width = (no / P * (1 - FEE_POOL) * 100) + '%';
      cpFee.style.width = (FEE_POOL * 100) + '%';
      const host = state.side === 'yes' ? cpYes : cpNo;
      if (cpYou.parentElement !== host) host.appendChild(cpYou);
      const sidePool = state.side === 'yes' ? yes : no;
      cpYou.style.width = sidePool > 0 ? Math.min(100, S / sidePool * 100) + '%' : '0%';
    } else {
      cpYes.style.width = cpNo.style.width = cpFee.style.width = '0%';
    }
    $('#cplYou').textContent = `you ${money(S)}`;
    $('#cplYes').textContent = `${lab.nameYes} ${money(yes)}`;
    $('#cplNo').textContent = `${lab.nameNo} ${money(no)}`;
    $('#cplFee').textContent = `fee ${money(fee)}`;

    animPayout(payoutNum, payout);
    payoutNum.classList.toggle('pos', payout > S && S > 0);
    payoutNum.classList.toggle('zero', !won && S > 0);

    if (S <= 0) {
      delta.textContent = 'enter a stake to see your payout';
      delta.className = 'calc-payout-delta';
      formula.textContent = 'Payout = Stake × Pool × (1 − fee) ÷ Winning side';
    } else if (won) {
      const pct = (payout / S - 1) * 100;
      delta.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% on your ${money(S)}`;
      delta.className = 'calc-payout-delta ' + (pct >= 0 ? 'pos' : 'neg');
      formula.textContent = `${money(S)} × (${money(P)} × ${(1 - FEE_POOL).toFixed(2)}) ÷ ${money(W)} = ${money(payout, 3)}`;
    } else {
      delta.textContent = `−100% · your side lost the pool`;
      delta.className = 'calc-payout-delta neg';
      formula.textContent = `losing side → $0 · winners split ${money(paypool)}`;
    }
    split.innerHTML = lab.split(fee);

    const sidePool = state.side === 'yes' ? yes : no;
    const other = P - sidePool;
    if (S > 0 && won && P > 0 && sidePool < other) {
      const against = Math.round(other / P * 100);
      const mult = W > 0 ? (paypool / W).toFixed(2) : '0';
      insight.innerHTML = `${against}% of the money disagreed with you — and you were right. That’s a ${mult}× pool multiple. <em>Early, correct conviction is what gets paid.</em>`;
    } else if (S > 0 && won) {
      insight.innerHTML = 'You sided with the crowd, so you split the pool with almost everyone. <em>Consensus wins pennies; early conviction wins multiples.</em>';
    } else {
      insight.innerHTML = 'The pool balance <em>is</em> the price: side with the crowd and win pennies — be right against it and get paid multiples.';
    }
  }

  function setScen(scen) {
    state.scen = scen;
    $$('.calc-tab').forEach(b => {
      const on = b.dataset.scen === scen;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });
    const isPerp = scen === 'perp';
    $('#panePool').classList.toggle('hidden', isPerp);
    $('#panePerp').classList.toggle('hidden', !isPerp);
    if (!isPerp) {
      const lab = L[scen];
      $('#cSideLab').textContent = lab.sideLab;
      $('#cOutLab').textContent = lab.outLab;
      const sideBtns = $$('#cSide .seg'), outBtns = $$('#cOutcome .seg');
      sideBtns[0].textContent = lab.sideYes; sideBtns[1].textContent = lab.sideNo;
      outBtns[0].textContent = lab.outYes; outBtns[1].textContent = lab.outNo;
    }
    updateCalc();
  }

  function initCalc() {
    if (!$('#calc')) return;
    $$('.calc-tab').forEach(b => b.addEventListener('click', () => setScen(b.dataset.scen)));
    const seg = (wrapSel, key) => {
      $$(wrapSel + ' .seg').forEach(b => b.addEventListener('click', () => {
        state[key] = b.dataset.side || b.dataset.out;
        $$(wrapSel + ' .seg').forEach(x => {
          const on = x === b;
          x.classList.toggle('active', on);
          x.setAttribute('aria-checked', on);
        });
        updateCalc();
      }));
    };
    seg('#cSide', 'side');
    seg('#cOutcome', 'out');
    ['#cStake', '#cYes', '#cNo', '#pStake', '#pEntry', '#pExit', '#pFee'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('input', updateCalc);
    });
    updateCalc();
  }

  /* ---------------- FAQ accordion ---------------- */
  function initFaq() {
    $$('.faq-item').forEach(item => {
      const q = $('.faq-q', item), a = $('.faq-a', item);
      q.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        q.setAttribute('aria-expanded', open);
        a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
      });
    });
    window.addEventListener('resize', () => {
      $$('.faq-item.open .faq-a').forEach(a => { a.style.maxHeight = a.scrollHeight + 'px'; });
    });
  }

  /* ---------------- mobile nav ---------------- */
  function initBurger() {
    const nav = $('#nav'), burger = $('#navBurger');
    if (!nav || !burger) return;
    const close = () => { nav.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = nav.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
    });
    $$('#navLinks a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('menu-open') && !nav.contains(e.target)) close();
    });
    window.addEventListener('scroll', () => {
      if (nav.classList.contains('menu-open')) close();
    }, { passive: true });
  }

  /* ---------------- standalone pages (no app.js) ---------------- */
  function initStandalone() {
    if (document.getElementById('app')) return; // app.js drives these on the demo page
    const nav = $('#nav');
    if (nav) {
      const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal:not(.in)').forEach(el => io.observe(el));
  }

  /* ---------------- boot ---------------- */
  function boot() {
    initValBars();
    initCounters();
    initCalc();
    initFaq();
    initBurger();
    initStandalone();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
