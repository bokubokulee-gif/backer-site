/* One hundred hypothetical inputs, presented as questions rather than forecast results. */
(() => {
  'use strict';
  const root = document.querySelector('[data-question-stream]');
  if (!root) return;
  const questions = [
    "Will next quarter's orders reflect real demand, or stockpiling ahead of a price increase?",
    "If tariffs add 8% to costs, which customers will accept higher prices and which will switch suppliers?",
    "How much share could a rival's exclusive distribution deal take before our next earnings call?",
    "If supply falls 15%, which allocation choices preserve long-term accounts rather than this quarter's sales?",
    "Will customers commit enough volume to justify a $500 million factory before we break ground?",
    "Which customers will cut their renewal scope as procurement teams tighten budgets for the coming year?",
    "After an AI rollout, which employee habits will change, and where will people keep using old workflows?",
    "How will customers, dealers, and employees respond if a product recall expands from one market to five?",
    "What would persuade local buyers to trust a global brand entering a market with strong domestic competitors?",
    "As AI assistants guide product choices, which brands gain attention and which become interchangeable?",
    "Which markets will see electric-car buyers delay orders if charging queues double at peak times?",
    "Where could a 5% price increase protect margins without pushing customers toward a lower-priced product line?",
    "Which accounts become reachable if a rival merges its sales force and disrupts established relationships?",
    "How will major customers change their orders if delivery promises move from two weeks to six weeks?",
    "Could selling a mature division weaken customer relationships that support growth elsewhere in the company?",
    "When a customer's internal sponsor leaves, what makes the replacement retain, expand, or replace our contract?",
    "Where will a 10% headcount reduction create service bottlenecks before customers begin to leave?",
    "What response would rebuild trust after a service outage: compensation, transparency, or visible repair?",
    "If a government ends consumer rebates, which buyers postpone purchases and which choose cheaper alternatives?",
    "How would a direct sales expansion change distributors' willingness to recommend and stock our products?",
    "If households cut spending 5%, which retail categories will lose basket share first?",
    "How will customers move savings between banks if deposit rates fall by one percentage point?",
    "Will a rival's cheaper product bring new customers into the category or pull buyers away from premium brands?",
    "Which suppliers might delay investment if we shorten contracts while asking them to reserve more capacity?",
    "How would customers react if an acquisition combined their two preferred suppliers into a single provider?",
    "What would convince a global customer to standardize on one supplier instead of letting each region choose?",
    "How will a return-to-office rule affect experienced employees' willingness to stay through a restructuring?",
    "Which parts of a sustainability claim will customers trust, question, or repeat when critics challenge it?",
    "Where would local partnerships create more buyer confidence than launching under the parent company's name?",
    "If a platform changes recommendations, where will buyers find our category and who will shape their choices?",
    "When shoppers switch to private-label goods, which premium brands can win them back after a downturn?",
    "Which policyholders will leave if renewal premiums rise 12% after a quiet claims year?",
    "How quickly might customers reconsider established vendors after a rival launches a credible free alternative?",
    "Will distributors share more accurate demand signals if inventory risk shifts partly back to the manufacturer?",
    "Which markets need more capacity if customers move 20% of sourcing out of one country?",
    "How will a three-year contract offer change buyers' choices when their own demand outlook remains uncertain?",
    "Could new sales incentives encourage teams to book deals that customers are unlikely to renew or fully deploy?",
    "After a data breach, which customer groups will leave first, and which response would retain them?",
    "What will make buyers choose locally manufactured products when imported alternatives remain 12% cheaper?",
    "Which retail partners would give us more shelf space if we simplified the range instead of raising discounts?",
    "Will patients change providers if appointment waits rise from 7 days to 21?",
    "Which business customers value stable three-year pricing over a lower first-year quote with annual resets?",
    "How would a competitor's plant closure change customer switching before our sales teams see new inquiries?",
    "If we split orders across two suppliers, how will each change its pricing, service, and willingness to invest?",
    "Will entering an adjacent category strengthen the brand or leave customers less sure what it stands for?",
    "Where could a successful enterprise pilot fail to expand because its users and budget owners disagree?",
    "Will teams adopt automation faster if retraining comes before new productivity targets rather than after them?",
    "Would acknowledging uncertainty early in a safety inquiry preserve more trust than waiting for full answers?",
    "How could data-localization rules change which technology providers enterprise buyers will consider?",
    "How will resellers change recommendations if a competitor offers better margins but buyers prefer our brand?",
    "Which regional demand shifts will persist after holiday sales peak and distributors start reducing inventory?",
    "Which routes will lose business travelers if a competing airline doubles its flight frequency?",
    "Which buyers would switch if a rival bundled products we sell separately into one simpler buying decision?",
    "How might customers react to shortages when we prioritize strategic accounts over our longest-standing buyers?",
    "Could combining two acquired brands save costs while losing the local trust that made each business valuable?",
    "What would cause a customer to shrink a major contract even when frontline users still value the product?",
    "How will employees react if AI handles routine work but they remain responsible for reviewing its mistakes?",
    "Which audiences see a price increase during a shortage as necessary, and which interpret it as exploitation?",
    "How will local retailers react if our market entry relies on a global partner they see as a future competitor?",
    "Would franchise operators back a national promotion if it raises traffic but reduces profit per customer?",
    "How will corporate customers change spending priorities if financing costs stay high for another 18 months?",
    "If the dollar rises 10%, where will overseas buyers cut orders rather than accept higher prices?",
    "How would buyers react if a trusted competitor were acquired by a company with a very different reputation?",
    "Which customers will build extra safety stock after a disruption, and when could those orders reverse?",
    "How much demand might shift to other products in our portfolio if we discontinue a familiar low-margin line?",
    "Will customers accept a global service model if it removes the local account teams they currently trust?",
    "How could new promotion criteria change managers' willingness to share talent and knowledge across divisions?",
    "What will customers and employees infer if we cut service staff while announcing major investment in AI?",
    "Will a regional brand campaign strengthen local trust or undermine our global positioning?",
    "Which changes in a multichannel sales strategy move demand between partners rather than create new sales?",
    "Which enterprise clients will replace telecom contracts when a cloud provider bundles connectivity?",
    "How would a 10% premium for faster delivery change which buyers choose our standard and priority services?",
    "What makes customers stay when a rival copies our flagship feature and markets it as an industry standard?",
    "Will industrial buyers sign five-year energy contracts if spot prices fall 20%?",
    "Would investing in customer service protect more future revenue than expanding into a new market this year?",
    "Which customers would consolidate their vendors after a merger, and what would put us on the preferred list?",
    "How might a reorganization change whether employees raise problems before those problems reach customers?",
    "Could openly explaining a supply failure reduce customer exits more than a broad advertising campaign?",
    "If trade rules narrow product choice, will customers pay more, postpone purchases, or change what they buy?",
    "Which partners would keep building around our platform if we started competing with part of their business?",
    "How might a warmer winter shift product demand and change the orders retail buyers place for next season?",
    "What happens to loyalty if long-term customers learn that new buyers receive significantly better prices?",
    "Where could an emerging rival gain trust fastest: product performance, reliable service, or simpler contracts?",
    "How would suppliers respond if we paid faster in return for priority when production capacity becomes scarce?",
    "What makes customers stay after a business changes ownership rather than use the moment to renegotiate?",
    "How will procurement teams weigh a 15% saving against the disruption of replacing an established supplier?",
    "Which teams might resist a new operating model because it removes the relationships that make them effective?",
    "How will communities and customers react to a factory closure paired with retraining versus compensation?",
    "Which markets will accept subscriptions for products customers have always owned outright?",
    "Could shared loyalty rewards bring customers across our brands, or subsidize purchases they already planned?",
    "Which new sources of attention could turn a niche preference into a major shift in demand across a category?",
    "How will regional price differences change where global customers buy and how they negotiate group contracts?",
    "What share of a troubled bank's deposits would move to us rather than money-market funds?",
    "Would customers place firmer orders if we guaranteed supply, or use that promise to keep their options open?",
    "How will cutting $200 million from R&D affect talent retention and our next product cycle?",
    "What shifts in a buying committee could turn a secure renewal into a competitive tender next quarter?",
    "Will a new pay structure retain our top engineers or send them to faster-growing competitors?",
    "Which stakeholders would trust an independent review after a crisis, and which would expect new leadership?",
    "How might national sentiment change demand for a global brand with unchanged products, prices, and service?",
    "If a partner controls more of customer discovery, how will buyers' choices and our bargaining position change?"
];
  const ROWS_VISIBLE = 5;
  const ROWS_RENDERED = ROWS_VISIBLE + 1;
  const MS_PER_ROW = 7000;
  const track = root.querySelector('[data-question-track]');
  const viewport = root.querySelector('[data-question-window]');
  if (!track || !viewport) return;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let firstQuestion = 0;
  let progress = 0;
  let animationFrame = 0;
  let lastTime = 0;
  let visible = !('IntersectionObserver' in window);
  let manuallyPaused = false;
  let hovered = false;
  let focused = false;

  function fillRow(row, index, offset) {
    const number = index + 1;
    row.querySelector('.p2q-number').textContent = String(number).padStart(2, '0');
    row.querySelector('p').textContent = questions[index];
    row.setAttribute('aria-posinset', String(number));
    row.setAttribute('aria-setsize', String(questions.length));
    row.setAttribute('aria-hidden', String(offset >= ROWS_VISIBLE));
  }

  function createRow(index, offset) {
    const row = document.createElement('div');
    row.className = 'p2q-row';
    row.setAttribute('role', 'listitem');
    const number = document.createElement('span');
    number.className = 'p2q-number';
    number.setAttribute('aria-hidden', 'true');
    row.append(number, document.createElement('p'));
    fillRow(row, index, offset);
    return row;
  }

  function paint() {
    // Percentage is relative to the six-row track, so responsive row sizes need no measurement.
    track.style.transform = `translate3d(0, ${-progress * 100 / ROWS_RENDERED}%, 0)`;
  }

  function render() {
    const rows = document.createDocumentFragment();
    for (let offset = 0; offset < ROWS_RENDERED; offset += 1) {
      rows.append(createRow((firstQuestion + offset) % questions.length, offset));
    }
    track.replaceChildren(rows);
    paint();
  }

  function advanceOneRow() {
    firstQuestion = (firstQuestion + 1) % questions.length;
    const row = track.firstElementChild;
    track.append(row);
    fillRow(row, (firstQuestion + ROWS_RENDERED - 1) % questions.length, ROWS_RENDERED - 1);
    Array.from(track.children).forEach((item, offset) => {
      item.setAttribute('aria-hidden', String(offset >= ROWS_VISIBLE));
    });
  }

  function canAnimate() {
    return visible && !document.hidden && !manuallyPaused && !hovered && !focused && !motionPreference.matches;
  }

  function stopAnimation() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastTime = 0;
  }

  function tick(time) {
    animationFrame = 0;
    if (!canAnimate()) {
      lastTime = 0;
      return;
    }
    if (lastTime) progress += Math.min(time - lastTime, 80) / MS_PER_ROW;
    lastTime = time;
    while (progress >= 1) {
      progress -= 1;
      advanceOneRow();
    }
    paint();
    animationFrame = window.requestAnimationFrame(tick);
  }

  function syncAnimation() {
    if (canAnimate()) {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(tick);
    } else stopAnimation();
  }

  function browseQuestions(index) {
    stopAnimation();
    firstQuestion = (index % questions.length + questions.length) % questions.length;
    progress = 0;
    render();
    syncAnimation();
  }

  viewport.setAttribute('aria-keyshortcuts', 'ArrowDown ArrowUp PageDown PageUp Home End Space');
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
    let target;
    if (event.key === 'ArrowDown') target = firstQuestion + 1;
    else if (event.key === 'ArrowUp') target = firstQuestion - 1;
    else if (event.key === 'PageDown') target = firstQuestion + ROWS_VISIBLE;
    else if (event.key === 'PageUp') target = firstQuestion - ROWS_VISIBLE;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = Math.max(0, questions.length - ROWS_VISIBLE);
    else if (event.key === ' ') {
      event.preventDefault();
      if (event.repeat) return;
      manuallyPaused = !manuallyPaused;
      syncAnimation();
      return;
    } else return;
    event.preventDefault();
    browseQuestions(target);
  });
  viewport.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovered = true;
    syncAnimation();
  });
  viewport.addEventListener('pointerleave', () => {
    hovered = false;
    syncAnimation();
  });
  viewport.addEventListener('focusin', () => {
    focused = true;
    syncAnimation();
  });
  viewport.addEventListener('focusout', event => {
    focused = viewport.contains(event.relatedTarget);
    syncAnimation();
  });
  document.addEventListener('visibilitychange', syncAnimation);
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      stopAnimation();
      progress = 0;
      render();
    }
    syncAnimation();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      syncAnimation();
    }, { threshold: 0.01 });
    observer.observe(viewport);
  }
  render();
  syncAnimation();
})();
