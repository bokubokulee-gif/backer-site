const controls = Array.from(document.querySelectorAll('#intervention-controls input[type="range"]'));
const stageLinks = Array.from(document.querySelectorAll('[data-stage-link]'));
const stages = Array.from(document.querySelectorAll('[data-stage]'));
const runButton = document.querySelector('#run-experiment');
const runState = document.querySelector('#run-state');
const runNote = document.querySelector('#run-note');
const copyToast = document.querySelector('#copy-toast');

function updateControl(control) {
  const output = document.querySelector(`output[for="${control.id}"]`);
  if (output) output.textContent = control.value;
  const minimum = Number(control.min || 0);
  const maximum = Number(control.max || 100);
  const progress = ((Number(control.value) - minimum) / Math.max(1, maximum - minimum)) * 100;
  control.style.setProperty('--range-progress', `${progress}%`);
  control.closest('.experiment-control')?.classList.toggle('is-changed', control.value !== control.dataset.baseline);
}

function updateDeclaredState() {
  const changed = controls.filter((control) => control.value !== control.dataset.baseline).length;
  if (runState) runState.textContent = changed ? `${changed} declared change${changed === 1 ? '' : 's'}` : 'Public example';
  if (runNote) runNote.textContent = changed
    ? 'Conditions are staged for explanation only. The public browser does not execute the research model.'
    : 'The public page shows reviewed example outputs. Research formulas and full profiles run outside the browser.';
}

controls.forEach((control) => {
  updateControl(control);
  control.addEventListener('input', () => {
    updateControl(control);
    updateDeclaredState();
  });
});

document.querySelector('#reset-controls')?.addEventListener('click', () => {
  controls.forEach((control) => {
    control.value = control.dataset.baseline;
    updateControl(control);
  });
  updateDeclaredState();
});

document.querySelectorAll('[data-adapter-toggle]').forEach((toggle) => {
  toggle.addEventListener('change', () => {
    const card = toggle.closest('.adapter-card');
    card?.classList.toggle('is-disabled', !toggle.checked);
    const provenance = card?.querySelector('.adapter-provenance');
    if (provenance) provenance.textContent = toggle.checked ? 'Included public source' : 'Excluded from declared run';
  });
});

runButton?.addEventListener('click', () => {
  runState?.classList.remove('is-running');
  runState?.classList.add('is-complete');
  if (runState) runState.textContent = 'Secure research run required';
  if (runNote) runNote.textContent = 'Backer publishes reviewed aggregate outputs here. Population records, memories, and model formulas are not sent to the browser.';
});

function publicManifest() {
  const adapters = Array.from(document.querySelectorAll('[data-adapter-toggle]:checked'))
    .map((toggle) => toggle.dataset.adapterToggle)
    .join(', ');
  const declared = controls.map((control) => `${control.id}=${control.value}`).join('\n');
  return [
    'Backer Research Lab public run declaration',
    'protocol=BRL-002-public-projection',
    'population=5000 anonymous visual markers',
    `public_sources=${adapters || 'none'}`,
    declared,
    'runtime=secure research service; not included in browser artifact',
    'boundary=published aggregate preview, pending outcome validation',
  ].join('\n');
}

document.querySelector('#copy-manifest')?.addEventListener('click', async () => {
  const value = publicManifest();
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }
  copyToast?.classList.add('is-visible');
  window.setTimeout(() => copyToast?.classList.remove('is-visible'), 1400);
});

function setActiveStage(stageId) {
  stageLinks.forEach((link) => {
    const active = link.dataset.stageLink === stageId;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target?.dataset.stage) setActiveStage(visible.target.dataset.stage);
  }, { rootMargin: '-22% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });
  stages.forEach((stage) => observer.observe(stage));
} else {
  setActiveStage(stages[0]?.dataset.stage || 'sources');
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

updateDeclaredState();
