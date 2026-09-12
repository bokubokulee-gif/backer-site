/* Presentation state only. No forecast model, market execution, or private data. */
(() => {
  'use strict';
  // Shared homepage interaction; keep the warm gradient continuous per glyph.
  const headline = document.querySelector('.hero-title [data-bubble-text]');
  if (headline) {
    const prepareGradient = () => {
      const letters = [...headline.querySelectorAll('.bubble-letter')];
      if (!letters.length) return;
      const measure = () => {
        const gradientStart = letters[6].offsetLeft;
        const lastLetter = letters[letters.length - 1];
        // Include the italic ink overhang inside each padded glyph's paint box.
        headline.style.setProperty('--p2-bubble-width', `${lastLetter.offsetLeft + lastLetter.offsetWidth - gradientStart}px`);
        letters.forEach(letter => letter.style.setProperty('--p2-bubble-x', `${letter.offsetLeft - gradientStart}px`));
        headline.parentElement.classList.add('p2-bubble-ready');
      };
      measure();
      if (document.fonts) document.fonts.ready.then(measure);
      if ('ResizeObserver' in window) new ResizeObserver(measure).observe(headline);
      else window.addEventListener('resize', measure, { passive: true });
    };
    // bubble-text.js registers its splitter before this listener.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepareGradient, { once: true });
    else prepareGradient();
  }

  const decisionCopy = {
    "customers": [
        "Pricing and demand",
        "How much pricing power do we have?",
        "Assess how buyers trade down, delay purchases or switch suppliers as prices rise, and what those responses mean for revenue, margins and market share.",
        "Would passing higher costs through to customers protect margins after accounting for lost sales?"
    ],
    "audiences": [
        "Emerging demand",
        "Will growing attention expand the market?",
        "Test whether growing attention signals new demand, a shift from an existing category, or a passing spike. Compare how each spreads across customer groups and regions.",
        "Will rising interest in a new category expand the market or draw spending away from existing products?"
    ],
    "creators": [
        "Partnership economics",
        "How much new demand does each partnership bring?",
        "Evaluate creator partnerships as a portfolio: audience overlap, customer fit and the purchases each partnership could add beyond existing campaigns.",
        "Would adding another creator reach new customers, or pay again to influence the same audience?"
    ],
    "adspend": [
        "Budget allocation",
        "Which channels deserve more budget?",
        "Compare reallocating spend with holding the current mix. Account for audience saturation, delayed purchases and sales that would happen without advertising.",
        "Which channel gains incremental profit from more spend, and which has reached diminishing returns?"
    ]
};
  function wireTabs(selector, key, onChange) {
    const tabs = [...document.querySelectorAll(selector)];
    const select = (tab, focus = false) => {
      tabs.forEach(item => { const active = item === tab; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; });
      onChange(tab.dataset[key], tab.id);
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
        if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
      });
    });
  }
  wireTabs('[data-decision]', 'decision', (key, id) => {
    ['kicker', 'title', 'copy', 'question'].forEach((field, index) => { document.querySelector(`[data-decision-${field}]`).textContent = decisionCopy[key][index]; });
    document.querySelector('#decision-panel').setAttribute('aria-labelledby', id);
  });
  const gallery = document.querySelector('[data-circular-gallery]');
  if (gallery) {
    const cards = [...gallery.querySelectorAll('.person')];
    let current = 0;
    const render = () => cards.forEach((card, index) => {
      const offset = (index - current + cards.length) % cards.length;
      card.classList.toggle('is-active', offset === 0);
      card.classList.toggle('is-next', offset === 1);
      card.classList.toggle('is-prev', offset === cards.length - 1);
      if (!offset) card.setAttribute('aria-current', 'true'); else card.removeAttribute('aria-current');
    });
    gallery.querySelector('[data-orbit-prev]').addEventListener('click', () => { current = (current - 1 + cards.length) % cards.length; render(); });
    gallery.querySelector('[data-orbit-next]').addEventListener('click', () => { current = (current + 1) % cards.length; render(); });
    render();
  }
})();
