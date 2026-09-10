/* One hundred hypothetical inputs, presented as questions rather than forecast results. */
(() => {
  'use strict';
  const root = document.querySelector('[data-question-stream]');
  if (!root) return;
  const questions = [
    "How would a $149 product launch change revenue over the next 90 days?",
    "Where should the next $50,000 of ad spend go to reach buyers beyond our existing audience?",
    "Would 10 specialist creators drive more purchases than 1 celebrity with the same budget?",
    "Would a 10% price increase grow revenue or send high-value customers to a competitor?",
    "Would a 10% loyalty credit bring back inactive customers without discounting loyal buyers?",
    "Could a 14-day free trial convert more buyers than a 7-day trial with guided setup?",
    "Would bundling 3 features at $29 outperform selling each feature separately?",
    "Would a 15-second explanation attract more qualified buyers than a 60-second story?",
    "Would entering 2 new cities dilute local credibility or accelerate word of mouth?",
    "Would a 5% referral reward attract advocates or encourage low-intent signups?",
    "How would reducing checkout from 4 steps to 2 affect purchases of a $200 product?",
    "Would a 25% improvement in product speed matter more to buyers than a new headline feature?",
    "Would a 10-minute sales demo create more trust than a 30-minute consultation?",
    "Which of 3 product categories would benefit most from a creator's next wave of attention?",
    "Would offering 2 payment methods instead of 1 unlock new demand or add checkout friction?",
    "Would a 12-hour launch window help a creator concentrate attention or exclude loyal fans?",
    "How would a 2% trading fee affect whether people act on a small difference in conviction?",
    "Would a 20% budget cut hurt growth less in acquisition, creator partnerships, or retention?",
    "Which message would rebuild trust after a service outage lasting 4 hours?",
    "Would a 5,000-person community generate demand for a second product or prefer deeper support?",
    "Would releasing our product 2 weeks before a competitor help us capture lasting attention?",
    "Would shifting 25% of search spend to creators create demand or reduce near-term sales?",
    "Which creator could introduce our $80 product to people who have never considered the category?",
    "How would a $49 premium tier change demand for our existing $19 plan?",
    "Which customers would return after 30 days if we introduced a feature they had requested?",
    "Would removing 2 onboarding steps improve activation without weakening first-week retention?",
    "Which upgrade message would help users see the value of a 40% higher plan price?",
    "Which opening 3 seconds would keep our target audience watching through the offer?",
    "Which audience would try our product first with a $10,000 local launch budget?",
    "How would offering $20 to both referrer and friend change the quality of new customers?",
    "Would free shipping above $75 increase basket value or delay smaller purchases?",
    "Which of 4 proposed features would change a customer's decision to renew?",
    "Which objections would still stop a $5,000 purchase after a successful pilot?",
    "How long might interest persist after a 100,000-view post introduces an unfamiliar brand?",
    "How would a 3-month installment option change purchases of a $600 product?",
    "Which supporters would take a position after seeing 3 independent signs of momentum?",
    "Would 3 clear outcome examples help newcomers understand an attention market?",
    "Which campaign could recover demand fastest after a 2-week interruption?",
    "Would a public response within 2 hours reduce customer exits more than private outreach?",
    "Which adjacent category would our first 1,000 customers consider buying from us?",
    "How would a $99 launch price change expectations compared with a $149 launch price?",
    "Could 3 niche communities produce more retained customers than 1 broad-reach campaign?",
    "How would a 15% creator commission change the content audiences see and trust?",
    "Would a 20% annual-plan discount increase lifetime value or just pull revenue forward?",
    "Would sending 2 reminders a week deepen engagement or increase unsubscribes?",
    "Which first-use experience could turn a $30 acquisition into a repeat customer?",
    "Would introducing usage limits at 100 actions create upgrades or encourage switching?",
    "Would publishing 4 times a week build familiarity or make each post easier to ignore?",
    "Would a 30% lower introductory price overcome the trust gap in a new market?",
    "Could inviting 3 friends become a habit if the product delivered value before asking?",
    "Could showing 3 relevant reviews outperform a 10% discount at checkout?",
    "Could removing 30% of rarely used features make the product easier to choose?",
    "Could a 4-week pilot persuade finance teams as effectively as a 12-week trial?",
    "Would a second release within 14 days extend momentum or compete with the first?",
    "Could a $50 deposit improve commitment without excluding interested customers?",
    "How would a $5 minimum position change participation in a new attention market?",
    "Which market question would attract informed participation during a 7-day product launch?",
    "How would customers react if our most visible competitor launched a free alternative?",
    "How would a 10% service credit change the reactions of customers affected by a delay?",
    "How would launching 2 products together change attention, comparison, and total revenue?",
    "Would a 500-person waitlist create momentum or frustrate people ready to buy?",
    "Which channel mix would hold up if paid acquisition costs rose by 30%?",
    "Would a second sponsored post after 7 days reinforce the message or feel repetitive?",
    "Which customers would still choose us if a competitor cut its price by 15%?",
    "Could a $20 cancellation credit prevent churn beyond the next billing cycle?",
    "Would a 60-second product demo outperform a free trial for time-poor buyers?",
    "Could a $9 starter plan reach new buyers without pulling customers out of a $25 plan?",
    "How would attention spread if 20 community members shared the same launch independently?",
    "How would a 7-day delivery promise change demand where customers expect next-day service?",
    "Which users would share a new feature after using it twice, without a financial reward?",
    "Would a 30-day return policy change purchase decisions more than a lower price?",
    "Would an AI assistant save enough time for teams to accept a $15-per-seat price increase?",
    "How would adding 2 stakeholders to the buying process change the chance of closing?",
    "Could a smaller audience with 2 repeat visits convert better than a larger one-time audience?",
    "Would delaying the first payment by 30 days attract buyers who otherwise postpone?",
    "Would showing 10 early positions build confidence or cause people to follow the crowd?",
    "Would a creator's 10% share of market fees change how they introduce the market to fans?",
    "Would losing 1 major creator partner redirect attention to other advocates or rival brands?",
    "Would 3 independent customer stories restore confidence more than a brand-led explanation?",
    "Could a 90-day membership turn one-off event interest into repeat participation?",
    "Could a 30-day preorder campaign reveal demand without weakening launch-day purchases?",
    "Would doubling ad frequency from 3 to 6 exposures increase intent or exhaust attention?",
    "Could 5 long-term creator partnerships outperform 50 one-off sponsored posts?",
    "Would a $5 delivery fee lose more orders than a 3% increase in product prices?",
    "How would a 24-hour support delay change renewal decisions for our highest-value accounts?",
    "How would requiring a card at signup change the quality of our first 1,000 trial users?",
    "How would a 5-seat minimum affect adoption among small teams and future expansion?",
    "Could a 2-part story hold interest for a week longer than one complete announcement?",
    "Could a local creator with 50,000 followers outperform a global brand campaign in a new city?",
    "Would a 48-hour referral bonus create lasting growth or a short burst of activity?",
    "How would a $40 subscription compare with a $50 one-time purchase for hesitant buyers?",
    "How would 2 competing product roadmaps change customer attention over the next 6 months?",
    "Would a 20% implementation fee reduce demand or reassure buyers about service quality?",
    "Where might attention move if a platform reduced recommended posts by 20%?",
    "How would a 5% cash discount change order size and the mix of customers who buy?",
    "Could a weekly attention market keep people engaged longer than a single launch event?",
    "How might beliefs shift when a forecast and 100 independent market positions disagree?",
    "Could demand remain resilient if delivery times doubled from 3 days to 6?",
    "Could weekly progress updates retain customers during a 30-day product delay?",
    "Where would customers put their next $100 if our category stopped feeling new?"
];
  const ROWS_VISIBLE = 5;
  const ROWS_RENDERED = ROWS_VISIBLE + 1;
  const MS_PER_ROW = 9000;
  const track = root.querySelector('[data-question-track]');
  const viewport = root.querySelector('[data-question-window]');
  const controls = root.querySelector('[data-question-controls]');
  const toggle = root.querySelector('[data-question-toggle]');
  const toggleLabel = toggle.querySelector('[data-question-toggle-label]');
  const toggleIcon = toggle.querySelector('[data-question-toggle-icon]');
  const next = root.querySelector('[data-question-next]');
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

  function syncControls() {
    toggle.hidden = motionPreference.matches;
    toggleLabel.textContent = manuallyPaused ? 'Resume' : 'Pause';
    toggleIcon.textContent = manuallyPaused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', manuallyPaused ? 'Resume automatic question scrolling' : 'Pause automatic question scrolling');
    toggle.setAttribute('aria-pressed', String(manuallyPaused));
  }

  toggle.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    syncControls();
    syncAnimation();
  });
  next.addEventListener('click', () => {
    stopAnimation();
    firstQuestion = (firstQuestion + ROWS_VISIBLE) % questions.length;
    progress = 0;
    render();
    syncAnimation();
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
    syncControls();
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
  controls.hidden = false;
  syncControls();
  syncAnimation();
})();
