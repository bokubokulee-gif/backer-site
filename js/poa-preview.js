(function () {
  'use strict';

  var root = document.querySelector('[data-poa-preview]');
  if (!root || !window.PoaTerminal || !window.BACKER) return;

  var id = root.getAttribute('data-poa-preview');
  var creator = window.BACKER.byId ? window.BACKER.byId(id) : null;
  if (!creator) return;

  var model;
  try {
    model = window.PoaTerminal._build({ seed: id, creator: creator, name: creator.name });
  } catch (error) {
    return;
  }
  if (!model || !model.comp || !model.comp.length) return;

  var latest = model.comp[model.comp.length - 1];
  var grade = String(latest.grade || 'insufficient').toLowerCase();
  grade = grade.charAt(0).toUpperCase() + grade.slice(1);

  var confidence = root.querySelector('[data-poa-confidence]');
  if (confidence) confidence.textContent = grade + ' · ' + latest.conf;

  ['core', 'passive', 'anom', 'un'].forEach(function (key) {
    var band = root.querySelector('[data-poa-band="' + key + '"]');
    var range = latest.ranges && latest.ranges[key];
    var point = latest.point && latest.point[key];
    if (!band || !range || point == null) return;

    var rangeLabel = band.querySelector('[data-poa-range]');
    var rangeBar = band.querySelector('.poa-demo-range');
    var pointBar = band.querySelector('.poa-demo-track > i');
    if (rangeLabel) rangeLabel.textContent = point + ' · ' + range[0] + '–' + range[1] + '%';
    if (rangeBar) {
      rangeBar.style.setProperty('--range-left', range[0] + '%');
      rangeBar.style.setProperty('--range-width', Math.max(1, range[1] - range[0]) + '%');
    }
    if (pointBar) pointBar.style.setProperty('--point-left', point + '%');
    band.setAttribute('aria-label', band.querySelector('.poa-demo-band-label span').textContent.trim() + ' estimate: ' + range[0] + ' to ' + range[1] + ' percent; point estimate ' + point + ' percent');
  });

  var summary = model.summary || {};
  var coverage = summary.coverage || {};
  var evidence = root.querySelector('[data-poa-evidence]');
  var risk = root.querySelector('[data-poa-risk]');
  var videos = root.querySelector('[data-poa-videos]');
  var comments = root.querySelector('[data-poa-comments]');
  var coverageScore = root.querySelector('[data-poa-coverage]');
  if (evidence && summary.primaryEvidence) evidence.textContent = summary.primaryEvidence;
  if (risk && summary.primaryRisk) risk.textContent = summary.primaryRisk;
  if (videos && coverage.videos != null) videos.textContent = coverage.videos;
  if (comments && coverage.comments != null) comments.textContent = coverage.comments;
  if (coverageScore && coverage.score != null) coverageScore.textContent = coverage.score + '%';

  var pulse = root.querySelector('[data-poa-pulse]');
  if (pulse && model.days && model.days.length) {
    var observations = model.days.slice(-12);
    var values = observations.map(function (day) { return Number(day.c) || 0; });
    var lo = Math.min.apply(Math, values);
    var hi = Math.max.apply(Math, values);
    var bars = pulse.querySelectorAll('span');
    Array.prototype.forEach.call(bars, function (bar, index) {
      var value = values[index] == null ? lo : values[index];
      var height = hi === lo ? 55 : 24 + ((value - lo) / (hi - lo)) * 70;
      bar.style.setProperty('--pulse', Math.round(height) + '%');
      bar.classList.toggle('is-spike', value === hi);
    });
  }
})();
