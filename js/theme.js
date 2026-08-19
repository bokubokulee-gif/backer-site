(function () {
  'use strict';

  var STORAGE_KEY = 'backer_theme_v1';
  var root = document.documentElement;

  function readTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch (error) {
      return 'dark';
    }
  }

  function writeTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      /* Local storage is optional. The current page still switches theme. */
    }
  }

  function syncThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', theme === 'light' ? '#f3efe5' : '#000000');
  }

  function syncButtons(theme) {
    var action = theme === 'dark' ? 'light' : 'dark';
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    Array.prototype.forEach.call(buttons, function (button) {
      var label = button.querySelector('[data-theme-label]');
      var icon = button.querySelector('[data-theme-icon]');
      button.setAttribute('aria-label', 'Switch to ' + action + ' theme');
      button.setAttribute('title', 'Switch to ' + action + ' theme');
      button.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      if (label) label.textContent = action === 'light' ? 'Light' : 'Dark';
      if (icon) icon.textContent = action === 'light' ? '☼' : '◐';
    });
  }

  function applyTheme(theme, persist) {
    var next = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = next;
    root.style.colorScheme = next;
    syncThemeColor(next);
    syncButtons(next);
    if (persist) writeTheme(next);
    try {
      window.dispatchEvent(new CustomEvent('backer:themechange', { detail: { theme: next } }));
    } catch (error) {
      /* CustomEvent is enhancement-only. */
    }
  }

  function bindThemeControls() {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    Array.prototype.forEach.call(buttons, function (button) {
      if (button.dataset.themeBound === 'true') return;
      button.dataset.themeBound = 'true';
      button.addEventListener('click', function () {
        applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
      });
    });
    syncButtons(root.dataset.theme || 'dark');
  }

  applyTheme(readTheme(), false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindThemeControls);
  } else {
    bindThemeControls();
  }

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY) applyTheme(event.newValue === 'light' ? 'light' : 'dark', false);
  });

  window.BackerTheme = {
    get: function () { return root.dataset.theme || 'dark'; },
    set: function (theme) { applyTheme(theme, true); }
  };
})();
