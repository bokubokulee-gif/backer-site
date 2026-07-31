/* =========================================================
   BACKER — shared flickering footer
   Precomputes its text mask and pauses when offscreen/hidden.
   ========================================================= */
(function () {
  'use strict';

  var SELECTOR = '[data-footer-flicker]';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAVE_DATA = navigator.connection && navigator.connection.saveData;
  var STATIC_QUERY = /(?:^|[?&])footer-static(?:=1)?(?:&|$)/.test(window.location.search);

  function rgbFromFooter(footer) {
    var value = getComputedStyle(footer).getPropertyValue('--footer-grid-rgb').trim();
    return value || '152,146,136';
  }

  function preferredFontSize(width) {
    if (width > 1200) return 58;
    if (width > 900) return 50;
    if (width > 620) return 40;
    if (width > 420) return 32;
    return 27;
  }

  function textLines(text, width) {
    if (width >= 620 || text.indexOf(',') === -1) return [text];
    var parts = text.split(',');
    return [parts.shift().trim() + ',', parts.join(',').trim()];
  }

  function createController(canvas) {
    var footer = canvas.closest('.backer-footer');
    var stage = canvas.closest('.backer-footer__flicker');
    if (!footer || !stage || !canvas.getContext) return null;

    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var state = {
      width:0,
      height:0,
      dpr:1,
      square:2,
      gap:3,
      cols:0,
      rows:0,
      opacity:null,
      textCell:null,
      visible:false,
      running:false,
      frame:0,
      lastDraw:0,
      resizeFrame:0,
      rgb:rgbFromFooter(footer)
    };

    function setup() {
      var rect = stage.getBoundingClientRect();
      var width = Math.max(1,Math.round(rect.width));
      var height = Math.max(1,Math.round(rect.height));
      var dpr = Math.min(window.devicePixelRatio || 1,1.5);
      var square = 2;
      var gap = width <= 1024 ? 2 : 3;
      var cell = square + gap;
      var cols = Math.ceil(width / cell);
      var rows = Math.ceil(height / cell);
      var count = cols * rows;
      var opacity = new Float32Array(count);
      var textCell = new Uint8Array(count);
      var text = canvas.getAttribute('data-text') || 'Invest in people, before the world does';
      var lines = textLines(text,width);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);

      var mask = document.createElement('canvas');
      mask.width = width;
      mask.height = height;
      var maskCtx = mask.getContext('2d',{ willReadFrequently:true });
      var fontSize = preferredFontSize(width);
      var maxTextWidth = Math.max(100,width - Math.max(40,width * .08));

      maskCtx.textAlign = 'center';
      maskCtx.textBaseline = 'middle';
      while (fontSize > 18) {
        maskCtx.font = '600 ' + fontSize + 'px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        var widest = 0;
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
          widest = Math.max(widest,maskCtx.measureText(lines[lineIndex]).width);
        }
        if (widest <= maxTextWidth) break;
        fontSize -= 1;
      }

      maskCtx.fillStyle = '#fff';
      var lineHeight = fontSize * 1.14;
      var firstY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
      for (var line = 0; line < lines.length; line += 1) {
        maskCtx.fillText(lines[line],width / 2,firstY + line * lineHeight);
      }

      var pixels = maskCtx.getImageData(0,0,width,height).data;
      for (var col = 0; col < cols; col += 1) {
        for (var row = 0; row < rows; row += 1) {
          var index = col * rows + row;
          var x = Math.min(width - 1,Math.round(col * cell + square / 2));
          var y = Math.min(height - 1,Math.round(row * cell + square / 2));
          var alpha = pixels[(y * width + x) * 4 + 3];
          textCell[index] = alpha > 24 ? 1 : 0;
          opacity[index] = textCell[index]
            ? .5 + Math.random() * .36
            : .025 + Math.random() * .13;
        }
      }

      state.width = width;
      state.height = height;
      state.dpr = dpr;
      state.square = square;
      state.gap = gap;
      state.cols = cols;
      state.rows = rows;
      state.opacity = opacity;
      state.textCell = textCell;
      state.rgb = rgbFromFooter(footer);
      draw();
      stage.classList.add('is-ready');
    }

    function update() {
      var count = state.opacity.length;
      var updates = Math.max(1,Math.round(count * .035));
      for (var i = 0; i < updates; i += 1) {
        var index = Math.floor(Math.random() * count);
        state.opacity[index] = state.textCell[index]
          ? .46 + Math.random() * .45
          : .018 + Math.random() * .15;
      }
    }

    function draw() {
      var cell = state.square + state.gap;
      ctx.clearRect(0,0,state.width,state.height);
      ctx.fillStyle = 'rgb(' + state.rgb + ')';
      for (var col = 0; col < state.cols; col += 1) {
        for (var row = 0; row < state.rows; row += 1) {
          var index = col * state.rows + row;
          ctx.globalAlpha = state.opacity[index];
          ctx.fillRect(col * cell,row * cell,state.square,state.square);
        }
      }
      ctx.globalAlpha = 1;
    }

    function animate(time) {
      if (!state.running) return;
      if (time - state.lastDraw >= 84) {
        state.lastDraw = time;
        update();
        draw();
      }
      state.frame = window.requestAnimationFrame(animate);
    }

    function sync() {
      var shouldRun = state.visible && !document.hidden && !REDUCED && !SAVE_DATA && !STATIC_QUERY;
      if (shouldRun === state.running) return;
      state.running = shouldRun;
      window.cancelAnimationFrame(state.frame);
      if (shouldRun) state.frame = window.requestAnimationFrame(animate);
      else draw();
    }

    function queueSetup() {
      window.cancelAnimationFrame(state.resizeFrame);
      state.resizeFrame = window.requestAnimationFrame(function () {
        setup();
        sync();
      });
    }

    var resizeObserver = window.ResizeObserver
      ? new ResizeObserver(queueSetup)
      : null;
    if (resizeObserver) resizeObserver.observe(stage);
    else window.addEventListener('resize',queueSetup,{ passive:true });

    var intersectionObserver = window.IntersectionObserver
      ? new IntersectionObserver(function (entries) {
          state.visible = !!(entries[0] && entries[0].isIntersecting);
          sync();
        },{ rootMargin:'120px 0px' })
      : null;
    if (intersectionObserver) intersectionObserver.observe(stage);
    else state.visible = true;

    document.addEventListener('visibilitychange',sync);
    setup();
    sync();

    return {
      refresh:function () {
        state.rgb = rgbFromFooter(footer);
        draw();
      },
      rebuild:queueSetup
    };
  }

  function boot() {
    var canvases = document.querySelectorAll(SELECTOR);
    var controllers = [];
    for (var i = 0; i < canvases.length; i += 1) {
      var controller = createController(canvases[i]);
      if (controller) controllers.push(controller);
    }

    if (window.MutationObserver && controllers.length) {
      var observer = new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m += 1) {
          if (mutations[m].attributeName === 'data-theme') {
            for (var c = 0; c < controllers.length; c += 1) controllers[c].refresh();
            break;
          }
        }
      });
      observer.observe(document.documentElement,{ attributes:true,attributeFilter:['data-theme'] });
    }

    if (document.fonts && document.fonts.ready && controllers.length) {
      document.fonts.ready.then(function () {
        for (var c = 0; c < controllers.length; c += 1) controllers[c].rebuild();
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
