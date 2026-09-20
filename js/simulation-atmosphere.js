/* Adapted from the supplied ScannerCardStream interaction, without runtime dependencies.
 * These are fictional, authored records. This component performs no live inference. */
(() => {
  'use strict';
  const records = [
    {
      id: 'post-01', kind: 'Public post', icon: '↗', time: 'Day 01 · 09:10',
      quote: 'Everyone’s sharing the Atlas launch. I watched the demo, but I haven’t tried it.',
      fields: [
        ['object', 'Atlas launch', 'the Atlas launch'],
        ['observed', 'Watched demo', 'I watched the demo'],
        ['adoption', 'Not tried', 'I haven’t tried it'],
        ['purchase', 'Not observed', null]
      ],
      lesson: 'The source shows attention. It does not establish adoption or purchase.'
    },
    {
      id: 'review-02', kind: 'Product review', icon: '✧', time: 'Day 02 · 14:25',
      quote: 'Atlas looks useful. I stopped at setup because importing our old work would take the afternoon.',
      fields: [
        ['object', 'Atlas', 'Atlas'],
        ['observed', 'Stopped at setup', 'I stopped at setup'],
        ['friction', 'Importing work', 'importing our old work would take the afternoon'],
        ['retention', 'Not observed', null]
      ],
      lesson: 'The stated barrier identifies friction; it does not measure an abandonment rate.'
    },
    {
      id: 'earnings-03', kind: 'Earnings note', icon: '↗', time: 'Day 03 · 08:00',
      quote: 'Atlas increased R&D spending by 12% this quarter. The board kept the acquisition budget unchanged.',
      fields: [
        ['period', 'This quarter', 'this quarter'],
        ['R&D spend', '+12%', 'increased R&D spending by 12%'],
        ['M&A budget', 'Unchanged', 'kept the acquisition budget unchanged'],
        ['return', 'Not observed', null]
      ],
      lesson: 'The source reports an allocation. Its cause and return remain unknown.'
    },
    {
      id: 'notice-04', kind: 'Company notice', icon: '⌁', time: 'Day 04 · 11:40',
      quote: 'Managers may evaluate Atlas this week. Buying a license still requires the operations lead’s approval.',
      fields: [
        ['object', 'Atlas', 'Atlas'],
        ['access', 'Evaluation open', 'Managers may evaluate Atlas this week'],
        ['approval', 'Operations lead', 'requires the operations lead’s approval'],
        ['purchase', 'Not observed', null]
      ],
      lesson: 'Access to evaluation does not confer purchasing authority.'
    }
  ];
  const tr = value => window.BackerI18n ? window.BackerI18n.t(value) : value;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const clamp = value => Math.max(0, Math.min(1, value));

  function mount(root) {
    if (!root || root.__backerSignalScanner) return root && root.__backerSignalScanner;
    root.innerHTML = `<div class="ss-heading"><div><p class="sim-eyebrow">Evidence in context</p><h2>From a signal to<br>a model input.</h2></div><p>Scan a source. Inspect its features and trace each one to the supporting words.</p></div>
      <div class="ss-scene" tabindex="0" role="region" aria-label="Interactive signal scanner" aria-describedby="ss-instructions">
        <span class="ss-stage-label ss-stage-label--output">02 / Structured evidence</span><span class="ss-stage-label ss-stage-label--source">01 / Source record</span>
        <div class="ss-output-guide" aria-hidden="true"><p>Preserve the signal.<br>Expose the unknowns.</p><pre data-i18n-allow>├─ object        ──────\n├─ observation   ──────\n└─ unknown       ──────</pre></div>
        <div class="ss-source-echo ss-card" aria-hidden="true"></div>
        <div class="ss-traveller ss-card"><div class="ss-source"></div><div class="ss-features" aria-hidden="true" inert></div></div>
        <div class="ss-beam" aria-hidden="true"></div>
        <div class="ss-toolbar"><div class="ss-navigation"><button type="button" class="ss-prev" aria-label="Previous source">←</button><span class="ss-counter"></span><button type="button" class="ss-next" aria-label="Next source">→</button></div><span class="ss-instruction" id="ss-instructions">Drag the source left through the beam</span><button type="button" class="ss-scan-trigger"><span>Scan signal</span><span aria-hidden="true">↤</span></button></div>
      </div><div class="ss-caption"><p>Four fictional sources with authored features. This demonstration illustrates evidence tracing; it performs no live inference.</p><p class="ss-trace"></p></div><p class="ss-live" aria-live="polite" aria-atomic="true"></p>`;

    const scene = root.querySelector('.ss-scene');
    const traveller = root.querySelector('.ss-traveller');
    const source = traveller.querySelector('.ss-source');
    const features = root.querySelector('.ss-features');
    const echo = root.querySelector('.ss-source-echo');
    const guide = root.querySelector('.ss-output-guide');
    const beam = root.querySelector('.ss-beam');
    const trigger = root.querySelector('.ss-scan-trigger');
    const trace = root.querySelector('.ss-trace');
    const live = root.querySelector('.ss-live');
    const counter = root.querySelector('.ss-counter');
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const events = new AbortController();
    let index = 0;
    let progress = 0;
    let geometry = { width: 0, card: 0, left: 0, right: 0, compact: false };
    let frame = 0;
    let target = 0;
    let drag = null;
    let inView = true;
    let selectedField = null;

    function sourceMarkup(record, fieldIndex = null, comparison = false) {
      let quote = escapeHTML(tr(record.quote));
      const evidence = fieldIndex === null ? null : record.fields[fieldIndex][2];
      if (evidence) quote = quote.replace(escapeHTML(tr(evidence)), `<mark>${escapeHTML(tr(evidence))}</mark>`);
      return `<div class="ss-source-top"><span class="ss-source-kind"><span class="ss-source-icon" aria-hidden="true">${record.icon}</span>${escapeHTML(tr(record.kind))}</span><span>${String(index + 1).padStart(2, '0')}</span></div><p class="ss-quote">“${quote}”</p><div class="ss-source-bottom"><span>${escapeHTML(tr(`Fictional · ${record.time}`))}</span><span aria-hidden="true">${tr(comparison ? 'Source evidence' : '← drag to scan')}</span></div>`;
    }

    function setRecord(nextIndex) {
      cancelAnimationFrame(frame); frame = 0;
      index = (nextIndex + records.length) % records.length;
      progress = target = 0; selectedField = null; drag = null;
      scene.classList.remove('is-scanning', 'is-dragging');
      const record = records[index];
      source.innerHTML = sourceMarkup(record);
      echo.innerHTML = `<div class="ss-source">${sourceMarkup(record, null, true)}</div>`;
      features.innerHTML = `<div class="ss-feature-head"><span>${tr(`SOURCE ${String(index + 1).padStart(2, '0')} → FEATURES`)}</span><span>AUTHORED</span></div><div class="ss-feature-list">${record.fields.map((field, n) => `<button type="button" class="ss-feature" data-field="${n}" aria-pressed="false"><span class="ss-branch" aria-hidden="true">${n === record.fields.length - 1 ? '└─' : '├─'}</span><span class="ss-key">${escapeHTML(tr(field[0]))}</span><span class="ss-value">${escapeHTML(tr(field[1]))}</span></button>`).join('')}</div><div class="ss-feature-foot">Select a feature to inspect its evidence.</div>`;
      counter.textContent = `${String(index + 1).padStart(2, '0')} / 04`;
      trace.textContent = tr(record.lesson);
      live.textContent = `${tr(`Source ${index + 1} of 4`)}. ${tr(record.kind)}. ${tr(record.quote)}`;
      render();
    }

    function measure() {
      const width = scene.clientWidth;
      const compact = width < 700;
      const card = compact ? Math.min(350, width - 40) : Math.min(360, width * .355);
      geometry = { width, card, compact, left: compact ? (width - card) / 2 : width * .25 - card / 2, right: compact ? (width - card) / 2 : width * .75 - card / 2 };
      scene.style.setProperty('--ss-card-width', `${card}px`);
      scene.classList.toggle('is-compact', compact);
      guide.style.left = `${geometry.left}px`;
      echo.style.left = `${geometry.right}px`;
      render();
    }

    function render() {
      const { width, card, left, right, compact } = geometry;
      const position = right + (left - right) * progress;
      const reveal = compact ? progress : clamp((width / 2 - position) / card);
      traveller.style.transform = `translateX(${position}px)`;
      features.style.clipPath = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
      source.style.clipPath = `inset(0 0 0 ${reveal * 100}%)`;
      beam.style.left = `${compact ? left + card * progress : width / 2}px`;
      const done = progress >= .999;
      traveller.classList.toggle('is-scanned', done);
      scene.classList.toggle('has-progress', progress > .025);
      echo.classList.toggle('is-visible', done && !compact);
      source.setAttribute('aria-hidden', String(done));
      features.setAttribute('aria-hidden', String(!done));
      features.inert = !done;
      trigger.firstElementChild.textContent = tr(done ? (compact ? 'Read source' : 'Replay scan') : 'Scan signal');
      trigger.lastElementChild.textContent = done ? '↺' : '↤';
      root.querySelector('.ss-stage-label--source').textContent = tr(compact && done ? '02 / Structured evidence' : '01 / Source record');
      root.querySelector('.ss-instruction').textContent = tr(done ? 'Select a feature to inspect its source' : 'Drag the source left through the beam');
    }

    function finish(value, announce = true) {
      cancelAnimationFrame(frame); frame = 0; progress = target = value;
      scene.classList.remove('is-scanning', 'is-dragging');
      render();
      if (value === 1 && announce) {
        live.textContent = tr('Scan complete. Select a feature to inspect its evidence.');
        root.dispatchEvent(new CustomEvent('backer:signal-scanned', { bubbles: true, detail: { sourceId: records[index].id, index, features: records[index].fields.map(field => ({ name: field[0], value: field[1], evidence: field[2] })) } }));
      }
    }

    function animate(value) {
      cancelAnimationFrame(frame); frame = 0;
      target = value;
      if (motionQuery.matches || !inView || document.hidden) { finish(value); return; }
      const from = progress;
      const duration = Math.max(250, 1100 * Math.abs(value - from));
      const start = performance.now();
      scene.classList.add('is-scanning');
      const tick = now => {
        const t = clamp((now - start) / duration);
        const eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        progress = from + (value - from) * eased;
        render();
        if (t < 1) frame = requestAnimationFrame(tick);
        else finish(value);
      };
      frame = requestAnimationFrame(tick);
    }

    function inspectField(fieldIndex) {
      if (progress < .999) return;
      selectedField = fieldIndex;
      const record = records[index];
      const field = record.fields[fieldIndex];
      features.querySelectorAll('.ss-feature').forEach((button, n) => button.setAttribute('aria-pressed', String(n === fieldIndex)));
      echo.innerHTML = `<div class="ss-source">${sourceMarkup(record, fieldIndex, true)}</div>`;
      source.innerHTML = sourceMarkup(record, fieldIndex);
      trace.innerHTML = field[2] ? `<strong>${escapeHTML(tr(field[0]))} → ${escapeHTML(tr(field[1]))}</strong><br>${escapeHTML(tr('Source evidence'))}: “${escapeHTML(tr(field[2]))}”` : `<strong>${escapeHTML(tr(field[0]))} → ${tr('Not observed')}</strong><br>${tr('This source contains no evidence of that outcome.')}`;
      live.textContent = trace.textContent;
    }

    const onClick = event => {
      if (event.target.closest('.ss-prev')) setRecord(index - 1);
      else if (event.target.closest('.ss-next')) setRecord(index + 1);
      else if (event.target.closest('.ss-scan-trigger')) {
        if (progress >= .999 && !geometry.compact) { finish(0, false); animate(1); }
        else animate(progress >= .999 ? 0 : 1);
      }
      else if (event.target.closest('.ss-feature')) inspectField(Number(event.target.closest('.ss-feature').dataset.field));
      else if (event.target.closest('.ss-traveller') && progress === 0) animate(1);
    };
    let suppressClick = false;
    root.addEventListener('click', event => {
      if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
      onClick(event);
    }, { signal: events.signal });
    scene.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); setRecord(index + (event.key === 'ArrowRight' ? 1 : -1));
      } else if (event.target === scene && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault(); animate(progress >= .999 ? 0 : 1);
      }
    }, { signal: events.signal });
    scene.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.target.closest('.ss-traveller') || progress >= .999 || event.target.closest('button')) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, progress, active: false };
    }, { signal: events.signal });
    scene.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = drag.x - event.clientX, dy = drag.y - event.clientY;
      if (!drag.active) {
        if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (Math.abs(dx) < 6) return;
        cancelAnimationFrame(frame); frame = 0;
        drag.active = true; scene.setPointerCapture(event.pointerId); scene.classList.add('is-dragging');
      }
      const travel = geometry.compact ? geometry.card * .72 : geometry.right - geometry.left;
      progress = clamp(drag.progress + dx / travel);
      render();
    }, { signal: events.signal });
    const endDrag = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const active = drag.active;
      drag = null;
      if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
      if (active) { suppressClick = true; animate(progress > .2 ? 1 : 0); setTimeout(() => { suppressClick = false; }, 0); }
    };
    scene.addEventListener('pointerup', endDrag, { signal: events.signal });
    scene.addEventListener('pointercancel', endDrag, { signal: events.signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && frame) finish(target, false);
    }, { signal: events.signal });
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView && frame) finish(target, false);
    }, { threshold: .05 });
    observer.observe(scene);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(scene);
    const onMotionChange = () => { if (motionQuery.matches && frame) finish(target); };
    motionQuery.addEventListener('change', onMotionChange);
    setRecord(0); measure();
    const api = {
      select: setRecord,
      scan: () => animate(1),
      reset: () => animate(0),
      getState: () => ({ index, sourceId: records[index].id, progress, selectedField, animating: Boolean(frame), compact: geometry.compact }),
      destroy: () => { cancelAnimationFrame(frame); events.abort(); observer.disconnect(); resizeObserver.disconnect(); motionQuery.removeEventListener('change', onMotionChange); root.innerHTML = ''; delete root.__backerSignalScanner; }
    };
    root.__backerSignalScanner = api;
    return api;
  }
  window.BackerSignalScanner = { mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount(document.getElementById('signal-scanner')), { once: true });
  else mount(document.getElementById('signal-scanner'));
})();
