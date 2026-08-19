(function () {
  'use strict';

  var SESSION_KEY = 'backer_onboarding_draft_v1';
  var PROFILE_KEY = 'backer_profile';
  var VALID_ROLES = ['creator', 'backer'];
  var QUESTION_COUNTS = { creator: 2, backer: 3 };
  var draftRole = null;
  var state = {
    role: null,
    step: 0,
    answers: {
      creator: { platforms: [], revenue: '' },
      backer: { platforms: [], draw: '', time: '' }
    },
    skipped: {},
    startedAt: new Date().toISOString()
  };

  var roleScreen = document.getElementById('roleScreen');
  var form = document.getElementById('onboardingForm');
  var progressLabel = document.getElementById('progressLabel');
  var progressBar = document.getElementById('progressBar');
  var roleLabel = document.getElementById('roleLabel');
  var continueButton = document.getElementById('continueButton');
  var backButton = document.getElementById('backButton');
  var skipQuestionButton = document.getElementById('skipQuestion');
  var skipSetupButton = document.getElementById('skipSetupTop');
  var screenStatus = document.getElementById('screenStatus');

  function safeParse(value) {
    try { return JSON.parse(value || 'null'); } catch (error) { return null; }
  }

  function readSessionDraft() {
    var parsed = null;
    try { parsed = safeParse(window.sessionStorage.getItem(SESSION_KEY)); } catch (error) {}
    if (!parsed || typeof parsed !== 'object') return;
    draftRole = VALID_ROLES.indexOf(parsed.role) !== -1 ? parsed.role : null;
    if (parsed.answers && parsed.answers.creator && parsed.answers.backer) state.answers = parsed.answers;
    if (parsed.skipped && typeof parsed.skipped === 'object') state.skipped = parsed.skipped;
    if (typeof parsed.startedAt === 'string') state.startedAt = parsed.startedAt;
    if (Number.isInteger(parsed.step) && parsed.step >= 0) state.step = parsed.step;
  }

  function saveDraft() {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        role: state.role,
        step: state.step,
        answers: state.answers,
        skipped: state.skipped,
        startedAt: state.startedAt
      }));
    } catch (error) {}
  }

  function updateLocalRole() {
    var profile = {};
    try { profile = safeParse(window.localStorage.getItem(PROFILE_KEY)) || {}; } catch (error) {}
    profile.rolePreference = state.role === 'creator' ? 'CREATOR' : 'INVESTOR';
    try { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (error) {}
  }

  function queryRole() {
    var value = String(new URLSearchParams(window.location.search).get('role') || '').toLowerCase();
    return VALID_ROLES.indexOf(value) !== -1 ? value : null;
  }

  function setQueryRole(role) {
    if (!window.history || !window.history.replaceState) return;
    var next = new URL(window.location.href);
    if (role) next.searchParams.set('role', role);
    else next.searchParams.delete('role');
    window.history.replaceState({}, '', next.pathname + next.search + next.hash);
  }

  function currentQuestion() {
    return document.querySelector('.question-screen[data-role="' + state.role + '"][data-step="' + state.step + '"]');
  }

  function questionKey() {
    if (state.role === 'creator') return state.step === 0 ? 'creator-platforms' : 'creator-revenue';
    if (state.step === 0) return 'backer-platforms';
    if (state.step === 1) return 'backer-draw';
    return 'backer-time';
  }

  function announce(message) {
    screenStatus.textContent = '';
    window.setTimeout(function () { screenStatus.textContent = message; }, 10);
  }

  function focusQuestion() {
    var screen = currentQuestion();
    if (!screen) return;
    var heading = screen.querySelector('h2');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    try { heading.focus({ preventScroll: true }); } catch (error) { heading.focus(); }
  }

  function render() {
    var hasRole = VALID_ROLES.indexOf(state.role) !== -1;
    roleScreen.hidden = hasRole;
    form.hidden = !hasRole;
    document.body.setAttribute('data-role', state.role || 'choose');
    document.body.setAttribute('data-step', String(state.step));

    Array.prototype.forEach.call(document.querySelectorAll('.question-screen'), function (screen) {
      screen.hidden = !hasRole || screen.getAttribute('data-role') !== state.role || Number(screen.getAttribute('data-step')) !== state.step;
    });

    if (!hasRole) return;
    var total = QUESTION_COUNTS[state.role];
    if (state.step >= total) state.step = total - 1;
    progressLabel.textContent = (state.step + 1) + ' of ' + total;
    progressBar.style.width = (((state.step + 1) / total) * 100) + '%';
    roleLabel.textContent = state.role === 'creator' ? 'Creator setup' : 'Backer setup';
    continueButton.querySelector('span').textContent = state.step === total - 1 ? 'Finish' : 'Continue';
    hydrateInputs();
  }

  function hydrateInputs() {
    var creatorPlatforms = state.answers.creator.platforms || [];
    var backerPlatforms = state.answers.backer.platforms || [];
    Array.prototype.forEach.call(document.querySelectorAll('input[name="creator-platforms"]'), function (input) {
      input.checked = creatorPlatforms.indexOf(input.value) !== -1;
    });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="backer-platforms"]'), function (input) {
      input.checked = backerPlatforms.indexOf(input.value) !== -1;
    });
    document.getElementById('creatorRevenue').value = state.answers.creator.revenue || '';
    document.getElementById('backerDraw').value = state.answers.backer.draw || '';
    Array.prototype.forEach.call(document.querySelectorAll('input[name="backer-time"]'), function (input) {
      input.checked = input.value === state.answers.backer.time;
    });
    updatePlatformCounter('creator-platforms');
    updatePlatformCounter('backer-platforms');
    updateTextCount(document.getElementById('creatorRevenue'));
    updateTextCount(document.getElementById('backerDraw'));
  }

  function updatePlatformCounter(name) {
    var count = document.querySelectorAll('input[name="' + name + '"]:checked').length;
    var counter = document.querySelector('[data-counter="' + name + '"]');
    if (!counter) return;
    counter.textContent = count + ' of 3 selected';
    counter.classList.toggle('is-limit', count === 3);
  }

  function updateTextCount(textarea) {
    var counter = document.querySelector('[data-count-for="' + textarea.id + '"]');
    if (counter) counter.textContent = String(textarea.value.length);
  }

  function chooseRole(role) {
    if (VALID_ROLES.indexOf(role) === -1) return;
    state.role = role;
    state.step = 0;
    setQueryRole(role);
    updateLocalRole();
    saveDraft();
    render();
    announce((role === 'creator' ? 'Creator' : 'Backer') + ' setup started. Question 1 of ' + QUESTION_COUNTS[role] + '.');
    focusQuestion();
  }

  function saveTextAnswer(textarea, path) {
    var value = textarea.value.slice(0, 280);
    state.answers[state.role][path] = value;
    delete state.skipped[questionKey()];
    updateTextCount(textarea);
    saveDraft();
  }

  function clearCurrentAnswer() {
    var key = questionKey();
    state.skipped[key] = true;
    if (key === 'creator-platforms') state.answers.creator.platforms = [];
    if (key === 'creator-revenue') state.answers.creator.revenue = '';
    if (key === 'backer-platforms') state.answers.backer.platforms = [];
    if (key === 'backer-draw') state.answers.backer.draw = '';
    if (key === 'backer-time') state.answers.backer.time = '';
    saveDraft();
  }

  function persistCompletion(status) {
    var profile = {};
    try { profile = safeParse(window.localStorage.getItem(PROFILE_KEY)) || {}; } catch (error) {}
    var roleCode = state.role === 'creator' ? 'CREATOR' : 'INVESTOR';
    profile.rolePreference = roleCode;
    profile.recommendationSetup = {
      version: 1,
      status: status,
      role: roleCode,
      completedAt: new Date().toISOString(),
      responses: status === 'COMPLETED'
        ? (state.role === 'creator'
          ? {
              platforms: (state.answers.creator.platforms || []).slice(0, 3),
              largestSocialRevenueSource: String(state.answers.creator.revenue || '').trim().slice(0, 280)
            }
          : {
              platforms: (state.answers.backer.platforms || []).slice(0, 3),
              platformDraw: String(state.answers.backer.draw || '').trim().slice(0, 280),
              spendsMoreTimeThanDesired: String(state.answers.backer.time || '')
            })
        : {},
      skippedQuestions: status === 'COMPLETED' ? Object.keys(state.skipped).filter(function (key) { return state.skipped[key]; }) : ['all']
    };
    try { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (error) {}
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (error) {}
    window.location.href = 'signup.html?role=' + roleCode + '&onboarded=1';
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-role].role-option'), function (button) {
    button.addEventListener('click', function () { chooseRole(button.getAttribute('data-role')); });
  });

  Array.prototype.forEach.call(document.querySelectorAll('input[name$="-platforms"]'), function (input) {
    input.addEventListener('change', function () {
      var name = input.name;
      var checked = Array.prototype.slice.call(document.querySelectorAll('input[name="' + name + '"]:checked'));
      if (checked.length > 3) {
        input.checked = false;
        announce('Choose up to three platforms.');
        updatePlatformCounter(name);
        return;
      }
      var values = checked.map(function (item) { return item.value; });
      if (name === 'creator-platforms') state.answers.creator.platforms = values;
      else state.answers.backer.platforms = values;
      delete state.skipped[name];
      updatePlatformCounter(name);
      saveDraft();
    });
  });

  document.getElementById('creatorRevenue').addEventListener('input', function () {
    saveTextAnswer(this, 'revenue');
  });
  document.getElementById('backerDraw').addEventListener('input', function () {
    saveTextAnswer(this, 'draw');
  });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="backer-time"]'), function (input) {
    input.addEventListener('change', function () {
      if (!input.checked) return;
      state.answers.backer.time = input.value;
      delete state.skipped['backer-time'];
      saveDraft();
    });
  });

  backButton.addEventListener('click', function () {
    if (state.step > 0) {
      state.step -= 1;
      saveDraft();
      render();
      announce('Back to question ' + (state.step + 1) + '.');
      focusQuestion();
      return;
    }
    state.role = null;
    state.step = 0;
    setQueryRole(null);
    saveDraft();
    render();
    announce('Choose how you will use Backer.');
    var title = document.getElementById('setupTitle');
    title.setAttribute('tabindex', '-1');
    title.focus();
  });

  continueButton.addEventListener('click', function () {
    var total = QUESTION_COUNTS[state.role];
    if (state.step < total - 1) {
      state.step += 1;
      saveDraft();
      render();
      announce('Question ' + (state.step + 1) + ' of ' + total + '.');
      focusQuestion();
      return;
    }
    persistCompletion('COMPLETED');
  });

  skipQuestionButton.addEventListener('click', function () {
    clearCurrentAnswer();
    var total = QUESTION_COUNTS[state.role];
    if (state.step < total - 1) {
      state.step += 1;
      render();
      announce('Question skipped. Question ' + (state.step + 1) + ' of ' + total + '.');
      focusQuestion();
      return;
    }
    persistCompletion('COMPLETED');
  });

  skipSetupButton.addEventListener('click', function () {
    if (!state.role) {
      window.location.href = 'signup.html';
      return;
    }
    persistCompletion('SKIPPED');
  });

  readSessionDraft();
  var requestedRole = queryRole();
  if (requestedRole) {
    state.role = requestedRole;
    if (draftRole && draftRole !== requestedRole) state.step = 0;
    if (state.step >= QUESTION_COUNTS[state.role]) state.step = 0;
    updateLocalRole();
  } else {
    state.role = null;
    state.step = 0;
  }
  render();
})();
