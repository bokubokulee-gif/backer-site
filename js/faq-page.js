/* =========================================================
   BACKER FAQ — decorative spiral + searchable FAQ directory
   ========================================================= */
(function () {
  'use strict';

  const spiral = document.getElementById('faqSpiral');
  const search = document.getElementById('faqSearch');
  const clear = document.getElementById('faqSearchClear');
  const status = document.getElementById('faqSearchStatus');
  const empty = document.getElementById('faqEmpty');
  const items = Array.from(document.querySelectorAll('#faqList .faq-item'));

  function buildSpiral() {
    if (!spiral || spiral.childElementCount) return;
    const fragment = document.createDocumentFragment();
    const count = 420;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const radius = 45;

    for (let index = 0; index < count; index += 1) {
      const progress = (index + 0.5) / count;
      const distance = Math.sqrt(progress) * radius;
      const angle = (index + 0.5) * goldenAngle;
      const dot = document.createElement('i');
      dot.className = 'faq-spiral-dot';
      dot.style.setProperty('--faq-x', (Math.cos(angle) * distance).toFixed(3) + '%');
      dot.style.setProperty('--faq-y', (Math.sin(angle) * distance).toFixed(3) + '%');
      dot.style.setProperty('--faq-scale', (0.65 + progress * 0.85).toFixed(3));
      dot.style.setProperty('--faq-duration', (2.8 + (index % 11) * 0.11).toFixed(2) + 's');
      dot.style.setProperty('--faq-delay', (-progress * 3.2).toFixed(2) + 's');
      fragment.appendChild(dot);
    }

    spiral.appendChild(fragment);
  }

  function normalize(value) {
    return value.trim().toLocaleLowerCase();
  }

  function filterFaq() {
    const query = normalize(search ? search.value : '');
    let matches = 0;

    items.forEach((item) => {
      const match = !query || normalize(item.textContent || '').includes(query);
      item.hidden = !match;
      if (match) matches += 1;
    });

    if (clear) clear.hidden = !query;
    if (empty) empty.hidden = matches !== 0;
    if (status) status.textContent = query
      ? matches + (matches === 1 ? ' answer found' : ' answers found')
      : items.length + ' questions';
  }

  function addCardHalo(item) {
    item.addEventListener('pointermove', (event) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--faq-pointer-x', (event.clientX - rect.left).toFixed(1) + 'px');
      item.style.setProperty('--faq-pointer-y', (event.clientY - rect.top).toFixed(1) + 'px');
    });
  }

  buildSpiral();
  items.forEach(addCardHalo);

  if (search) {
    search.addEventListener('input', filterFaq);
    search.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && search.value) {
        search.value = '';
        filterFaq();
      }
    });
  }

  if (clear) {
    clear.addEventListener('click', () => {
      search.value = '';
      filterFaq();
      search.focus();
    });
  }

  filterFaq();
})();
