(function () {
  'use strict';

  var BASE = 'https://bokubokulee-gif.github.io/backer-site/';
  var NAV = [
    {
      key: 'product', label: 'Product', items: [
        { label: 'Marketplace', description: 'Back emerging creators before consensus.', href: BASE + 'backerdemo.html?view=market', icon: 'market' },
        { label: 'AI Search', description: 'Discover people through attention signals.', href: BASE + 'backerdemo.html?view=search', icon: 'search' },
        { label: 'Portfolio', description: 'Track positions and your proof of taste.', href: BASE + 'portfolio.html', icon: 'portfolio' }
      ]
    },
    {
      key: 'protocol', label: 'Protocol', items: [
        { label: 'Proof of Attention', description: 'See how Backer underwrites attention.', href: BASE + 'backerdemo.html#proof', icon: 'proof' },
        { label: 'Open methodology', description: 'Inspect the model, inputs, and limits.', href: BASE + 'backerdemo.html#proof', icon: 'method' },
        { label: 'Why metrics break', description: 'Learn why raw engagement misleads.', href: BASE + 'backerdemo.html#metrics', icon: 'metrics' }
      ]
    },
    {
      key: 'company', label: 'Company', items: [
        { label: 'Thesis', description: 'The first-principles case for Backer.', href: BASE + 'backerthesis.html', icon: 'thesis' },
        { label: 'Pitch', description: 'See why Backer should exist now.', href: BASE + 'pitch.html', icon: 'pitch' },
        { label: 'FAQ', description: 'Answers about markets, risk, and the beta.', href: BASE + 'faq.html', icon: 'faq' },
        { label: 'Privacy', description: 'Understand how Backer handles your data.', href: BASE + 'privacy.html', icon: 'privacy' }
      ]
    }
  ];

  var ICONS = {
    market: '<path d="M3.5 18.5 8.2 13l3.3 2.8 5.7-7"/><path d="M14 8.8h3.4v3.4"/>',
    search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4.5 4.5"/><path d="M8.2 10.8 10 12l3-3"/>',
    portfolio: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3.5-4 3 2 4-6"/>',
    proof: '<path d="M2.8 12s3.3-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.3 5.2-9.2 5.2S2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.2"/>',
    method: '<path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4"/><path d="m9 14 1.8 1.8L15 11.5"/>',
    metrics: '<path d="M3.5 17.5 7.5 13l3 2.4 2.5-5 2.4 2.3 5.1-6"/><path d="m13.7 15.4 5.4 5.1"/><path d="m19.1 15.4-5.4 5.1"/>',
    thesis: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z"/>',
    pitch: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="m7.5 13 3-3 2.5 2 3.5-4"/>',
    faq: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.7 1.8c-1 .7-1.5 1.1-1.5 2.2"/><path d="M12 17h.01"/>',
    privacy: '<path d="M12 2.7 20 6v5.5c0 5-3.4 8.3-8 9.8-4.6-1.5-8-4.8-8-9.8V6z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function chevron() {
    return '<svg class="backer-menu__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  }

  function arrow() {
    return '<svg class="backer-menu__arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M9 4l4 4-4 4"/></svg>';
  }

  function isCurrent(href) {
    var target = new URL(href);
    var currentFile = window.location.pathname.split('/').pop() || 'backerdemo.html';
    var targetFile = target.pathname.split('/').pop() || 'backerdemo.html';
    if (currentFile !== targetFile) return false;
    var targetView = target.searchParams.get('view');
    if (targetView) return new URLSearchParams(window.location.search).get('view') === targetView;
    if (target.hash) return window.location.hash === target.hash;
    return !window.location.search && !window.location.hash;
  }

  function linkMarkup(item) {
    var current = isCurrent(item.href) ? ' aria-current="page"' : '';
    return '<li class="backer-menu__item"><a class="backer-menu__link" href="' + item.href + '"' + current + '>' +
      '<span class="backer-menu__icon">' + icon(item.icon) + '</span>' +
      '<span class="backer-menu__copy"><span class="backer-menu__name">' + item.label + '</span>' +
      '<span class="backer-menu__description">' + item.description + '</span></span>' + arrow() + '</a></li>';
  }

  function groupMarkup(group, id, mobile) {
    var list = group.items.map(linkMarkup).join('');
    if (mobile) {
      return '<section class="backer-menu__accordion-section" data-mobile-group="' + group.key + '">' +
        '<button class="backer-menu__accordion-trigger" type="button" aria-expanded="' + (group.key === 'product' ? 'true' : 'false') + '" aria-controls="' + id + '-mobile-' + group.key + '">' +
        '<span>' + group.label + '</span>' + chevron() + '</button>' +
        '<div class="backer-menu__accordion-panel" id="' + id + '-mobile-' + group.key + '"' + (group.key === 'product' ? '' : ' hidden') + '><ul class="backer-menu__list">' + list + '</ul></div></section>';
    }
    return '<div class="backer-menu__group" data-desktop-group="' + group.key + '"' + (group.key === 'product' ? '' : ' hidden') + '><ul class="backer-menu__list">' + list + '</ul></div>';
  }

  function build(root, index) {
    var id = 'backer-site-menu-' + index;
    var triggers = NAV.map(function (group) {
      var current = group.items.some(function (item) { return isCurrent(item.href); }) ? ' is-current' : '';
      return '<button class="backer-menu__trigger' + current + '" type="button" data-menu-trigger="' + group.key + '" aria-label="' + group.label + '" aria-haspopup="true" aria-expanded="false" aria-controls="' + id + '-panel">' +
        '<span class="backer-menu__label" data-swap-label aria-hidden="true">' + group.label + '</span>' + chevron() + '</button>';
    }).join('');
    var desktopGroups = NAV.map(function (group) { return groupMarkup(group, id, false); }).join('');
    var mobileGroups = NAV.map(function (group) { return groupMarkup(group, id, true); }).join('');

    root.innerHTML = '<div class="backer-menu" data-backer-menu-root>' +
      '<nav class="backer-menu__rail" aria-label="Backer navigation">' + triggers + '</nav>' +
      '<div class="backer-menu__panel" id="' + id + '-panel" aria-hidden="true">' +
        '<div class="backer-menu__panel-inner"><div class="backer-menu__panel-head"><span class="backer-menu__panel-kicker" data-panel-label>Product</span><span class="backer-menu__panel-count" data-panel-count>03 destinations</span></div>' + desktopGroups + '</div></div>' +
      '<button class="backer-menu__mobile-trigger" type="button" aria-label="Open Backer menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="' + id + '-sheet"><span>Menu</span><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 5h12M3 9h12M3 13h12"/></svg></button>' +
      '<div class="backer-menu__scrim" data-menu-scrim aria-hidden="true"></div>' +
      '<div class="backer-menu__sheet" id="' + id + '-sheet" role="dialog" aria-modal="true" aria-label="Backer navigation" aria-hidden="true">' +
        '<div class="backer-menu__sheet-inner"><div class="backer-menu__sheet-head"><span class="backer-menu__sheet-title">Explore Backer</span><button class="backer-menu__mobile-close" type="button" aria-label="Close Backer menu"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="m4 4 10 10M14 4 4 14"/></svg></button></div>' +
        '<div class="backer-menu__accordion">' + mobileGroups + '</div>' +
        '<div class="backer-menu__sheet-foot"><a class="backer-menu__launch" href="' + BASE + 'backerdemo.html?view=market">Enter Backer Market <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h11M10 5l4 4-4 4"/></svg></a></div></div></div></div>';

    init(root);
  }

  function init(host) {
    var root = host.querySelector('[data-backer-menu-root]');
    var header = host.closest('header');
    var panel = root.querySelector('.backer-menu__panel');
    var triggers = Array.prototype.slice.call(root.querySelectorAll('[data-menu-trigger]'));
    var panelLabel = root.querySelector('[data-panel-label]');
    var panelCount = root.querySelector('[data-panel-count]');
    var mobileTrigger = root.querySelector('.backer-menu__mobile-trigger');
    var sheet = root.querySelector('.backer-menu__sheet');
    var closeButton = root.querySelector('.backer-menu__mobile-close');
    var scrim = root.querySelector('[data-menu-scrim]');
    var desktopOpen = null;
    var mobileOpen = false;
    var mobileQuery = window.matchMedia('(max-width:1099px)');
    if (header) header.classList.add('site-menu-header');

    function setDesktop(key, focusFirst) {
      desktopOpen = key;
      triggers.forEach(function (button) {
        button.setAttribute('aria-expanded', String(button.dataset.menuTrigger === key));
      });
      root.querySelectorAll('[data-desktop-group]').forEach(function (group) {
        group.hidden = group.dataset.desktopGroup !== key;
      });
      if (!key) {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        return;
      }
      var data = NAV.find(function (group) { return group.key === key; });
      panelLabel.textContent = data.label;
      panelCount.textContent = String(data.items.length).padStart(2, '0') + ' destinations';
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      if (focusFirst) {
        window.requestAnimationFrame(function () {
          var first = panel.querySelector('[data-desktop-group="' + key + '"] .backer-menu__link');
          if (first) first.focus();
        });
      }
    }

    function swapLetters(button) {
      if (mobileQuery.matches || button.dataset.swapping === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var span = button.querySelector('[data-swap-label]');
      var label = button.getAttribute('aria-label');
      var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var frame = 0;
      button.dataset.swapping = 'true';
      function tick() {
        if (frame >= 4) {
          span.textContent = label;
          button.dataset.swapping = 'false';
          return;
        }
        span.textContent = label.split('').map(function (letter, index) {
          if (letter === ' ' || index > frame + 1) return letter;
          return glyphs[(index * 7 + frame * 5 + label.length) % glyphs.length];
        }).join('');
        frame += 1;
        window.setTimeout(tick, 42);
      }
      tick();
    }

    triggers.forEach(function (button, index) {
      button.addEventListener('pointerenter', function () { swapLetters(button); });
      button.addEventListener('focus', function () { swapLetters(button); });
      button.addEventListener('click', function () {
        setDesktop(desktopOpen === button.dataset.menuTrigger ? null : button.dataset.menuTrigger, false);
      });
      button.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          var delta = event.key === 'ArrowRight' ? 1 : -1;
          triggers[(index + delta + triggers.length) % triggers.length].focus();
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          setDesktop(button.dataset.menuTrigger, true);
        } else if (event.key === 'Escape' && desktopOpen) {
          event.preventDefault();setDesktop(null, false);button.focus();
        }
      });
    });

    panel.addEventListener('keydown', function (event) {
      var links = Array.prototype.slice.call(panel.querySelectorAll('[data-desktop-group]:not([hidden]) .backer-menu__link'));
      var index = links.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        var activeTrigger = root.querySelector('[data-menu-trigger="' + desktopOpen + '"]');
        setDesktop(null, false);if (activeTrigger) activeTrigger.focus();
      } else if (index > -1 && ['ArrowDown','ArrowUp','Home','End'].indexOf(event.key) > -1) {
        event.preventDefault();
        if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = links.length - 1;
        else index = (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links[index].focus();
      }
    });

    function setAccordion(key) {
      root.querySelectorAll('[data-mobile-group]').forEach(function (section) {
        var open = section.dataset.mobileGroup === key;
        section.querySelector('.backer-menu__accordion-trigger').setAttribute('aria-expanded', String(open));
        section.querySelector('.backer-menu__accordion-panel').hidden = !open;
      });
    }

    function openMobile() {
      mobileOpen = true;setDesktop(null, false);setAccordion('product');
      document.body.classList.add('backer-menu-open');
      mobileTrigger.setAttribute('aria-expanded', 'true');
      sheet.setAttribute('aria-hidden', 'false');
      sheet.classList.add('is-open');scrim.classList.add('is-open');
      window.requestAnimationFrame(function () { closeButton.focus(); });
    }

    function closeMobile(restoreFocus) {
      if (!mobileOpen) return;
      mobileOpen = false;document.body.classList.remove('backer-menu-open');
      mobileTrigger.setAttribute('aria-expanded', 'false');
      sheet.setAttribute('aria-hidden', 'true');
      sheet.classList.remove('is-open');scrim.classList.remove('is-open');
      if (restoreFocus) mobileTrigger.focus();
    }

    mobileTrigger.addEventListener('click', function () { mobileOpen ? closeMobile(true) : openMobile(); });
    closeButton.addEventListener('click', function () { closeMobile(true); });
    scrim.addEventListener('click', function () { closeMobile(true); });
    root.querySelectorAll('.backer-menu__accordion-trigger').forEach(function (button) {
      button.addEventListener('click', function () { setAccordion(button.closest('[data-mobile-group]').dataset.mobileGroup); });
    });

    sheet.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault();closeMobile(true);return; }
      if (event.key !== 'Tab') return;
      var focusable = Array.prototype.slice.call(sheet.querySelectorAll('button:not([disabled]),a[href]')).filter(function (element) {
        return element.offsetParent !== null;
      });
      if (!focusable.length) return;
      var first = focusable[0];var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault();last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first.focus(); }
    });

    root.querySelectorAll('.backer-menu__link,.backer-menu__launch').forEach(function (link) {
      link.addEventListener('click', function () { setDesktop(null, false);closeMobile(false); });
    });

    document.addEventListener('pointerdown', function (event) {
      if (!mobileOpen && desktopOpen && !root.contains(event.target)) setDesktop(null, false);
    });
    root.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (!mobileQuery.matches && desktopOpen && !root.contains(document.activeElement)) setDesktop(null, false);
      }, 0);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && desktopOpen) setDesktop(null, false);
    });
    mobileQuery.addEventListener('change', function () { setDesktop(null, false);closeMobile(false); });
  }

  function boot() {
    document.querySelectorAll('[data-backer-site-menu]').forEach(function (host, index) { build(host, index + 1); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
