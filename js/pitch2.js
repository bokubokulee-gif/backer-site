/* Presentation state only. No forecast model, market execution, or private data. */
(() => {
  'use strict';
  const loopCopy = {
    forecast: ['01', 'A view of the future, recorded before it arrives.', 'Before the release reaches its deadline, the Lab records a forecast of whether it will reach 100K views. The target, time window, and outcome source are fixed in advance.', 'Output: a forecast that can be tested.'],
    market: ['02', 'People bring their own view of the same outcome.', 'Participants weigh the evidence and take positions on that same 100K-view target. The Market records conviction, disagreement, and changing expectations before the deadline.', 'Output: a record of beliefs before the answer is known.'],
    outcome: ['03', 'The outcome tests the model and the market.', 'At month-end, the published source establishes whether the release reached 100K views. Comparing forecasts with this result creates one observation in a growing record of tests.', 'Output: measured performance, across repeated outcomes.']
  };
  const decisionCopy = {
    customers: ['The next customer', 'What will move someone from interest to purchase?', 'Explore how different customer groups may respond to an offer, message, or product before committing to a launch.', 'Who is likely to act, under which conditions?'],
    audiences: ['The next audience', 'Where will the next wave of attention come from?', 'Study how interest can move between communities, which audiences may respond, and where attention is more likely to persist.', 'Which communities will care, share, and return?'],
    creators: ['The next partnership', 'Which creators will earn the attention that matters?', 'Assess how a creator, their content, and an audience fit together before choosing a partnership or sponsorship.', 'Whose audience is likely to respond to this message?'],
    adspend: ['The next dollar', 'Where should the next dollar of ad spend go?', 'Compare audiences, messages, and distribution scenarios before allocating budget, then test the predictions against campaign outcomes.', 'Which allocation is worth testing before scaling spend?']
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
  wireTabs('[data-loop]', 'loop', (key, id) => {
    const [number, title, copy, result] = loopCopy[key];
    document.querySelector('.p2-loop-icon').textContent = number;
    document.querySelector('[data-loop-title]').textContent = title;
    document.querySelector('[data-loop-copy]').textContent = copy;
    document.querySelector('[data-loop-result]').textContent = result;
    document.querySelector('#loop-panel').setAttribute('aria-labelledby', id);
  });
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
