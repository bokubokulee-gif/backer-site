(function () {
  'use strict';

  var PREVIEW_STORAGE_KEY = 'backer_waitlist_preview_v1';
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var background = document.getElementById('bg');

  // shader.js only initializes a canvas named "bg". Renaming it before that
  // deferred script runs preserves the dot field as a static CSS fallback for
  // visitors who have asked the system to reduce motion.
  if (reducedMotion && background) background.id = 'bg-static';

  function ready() {
    var form = document.getElementById('waitlistForm');
    var input = document.getElementById('waitlist-email');
    var status = document.getElementById('waitlist-status');
    if (!form || !input || !status) return;

    var submit = form.querySelector('button[type="submit"]');
    var defaultButtonLabel = submit.textContent;

    function setStatus(message, kind, focusStatus) {
      status.textContent = message || '';
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
      form.classList.toggle('has-error', kind === 'error');
      input.setAttribute('aria-invalid', kind === 'error' ? 'true' : 'false');
      if (focusStatus) status.focus({ preventScroll: true });
    }

    function setBusy(busy) {
      form.setAttribute('aria-busy', busy ? 'true' : 'false');
      input.disabled = busy;
      submit.disabled = busy;
      submit.textContent = busy ? 'Joining…' : defaultButtonLabel;
    }

    function validEmail(value) {
      return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    function endpointFromMeta() {
      var meta = document.querySelector('meta[name="backer-waitlist-endpoint"]');
      var raw = meta ? String(meta.getAttribute('content') || '').trim() : '';
      if (!raw) return '';

      try {
        var url = new URL(raw, window.location.href);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        return url.href;
      } catch (error) {
        return null;
      }
    }

    function savePreviewRecord(email, submittedAt) {
      var storage = window.localStorage;
      if (!storage || typeof storage.setItem !== 'function') throw new Error('storage unavailable');
      storage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify({
        version: 1,
        email: email,
        submittedAt: submittedAt,
        source: 'waitlist-preview',
        sent: false
      }));
    }

    function postToEndpoint(endpoint, email, submittedAt) {
      var controller = typeof AbortController === 'function' ? new AbortController() : null;
      var timeout = controller ? window.setTimeout(function () { controller.abort(); }, 12000) : null;

      return window.fetch(endpoint, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          source: 'backer-waitlist',
          submittedAt: submittedAt
        }),
        signal: controller ? controller.signal : undefined
      }).then(function (response) {
        if (!response.ok) throw new Error('waitlist request failed');
        return response;
      }).finally(function () {
        if (timeout) window.clearTimeout(timeout);
      });
    }

    function complete(message) {
      setBusy(false);
      input.disabled = true;
      submit.disabled = true;
      submit.textContent = 'You’re in';
      setStatus(message, 'success', true);
    }

    input.addEventListener('input', function () {
      if (form.classList.contains('has-error')) setStatus('', '', false);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = input.value.trim();
      input.value = email;

      if (!validEmail(email)) {
        setStatus('Enter a complete email address, like you@example.com.', 'error', false);
        input.focus();
        return;
      }

      var endpoint = endpointFromMeta();
      if (endpoint === null) {
        setStatus('The waitlist connection is not configured correctly yet. Please try again later.', 'error', true);
        return;
      }

      var submittedAt = new Date().toISOString();
      setStatus('', '', false);
      setBusy(true);

      if (!endpoint) {
        try {
          savePreviewRecord(email, submittedAt);
          complete('Saved privately in this browser for the beta preview. No email was sent anywhere.');
        } catch (error) {
          setBusy(false);
          setStatus('Your browser blocked private preview storage, so this email was not saved or sent.', 'error', true);
        }
        return;
      }

      postToEndpoint(endpoint, email, submittedAt).then(function () {
        complete('You’re on the list. We’ll notify you when Backer is ready.');
      }).catch(function () {
        setBusy(false);
        setStatus('We couldn’t reach the waitlist. Your email was not saved—please try again.', 'error', true);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
