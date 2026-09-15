/* Shared Real Work gallery. Native modal keeps keyboard focus inside the viewer. */
(function () {
  'use strict';
  document.querySelectorAll('.jgal[data-srcs]').forEach(function (g) {
    var srcs = JSON.parse(g.dataset.srcs), alt = g.dataset.alt || 'Detailing project';
    var main = g.querySelector('.jgal__main img'), count = g.querySelector('.jgal__cnt');
    var strip = g.querySelector('.jgal__strip'), i = 0;
    var dialog = document.createElement('dialog');
    dialog.className = 'photo-viewer';
    dialog.setAttribute('aria-label', 'Project photos');
    dialog.innerHTML = '<div class="photo-viewer__bar"><span class="photo-viewer__count" aria-live="polite"></span><button type="button" class="photo-viewer__close" autofocus aria-label="Close photo viewer">Close ×</button></div><img class="photo-viewer__image" alt=""><div class="photo-viewer__nav"><button type="button" data-prev aria-label="Previous enlarged photo">← Previous</button><span>Swipe or use arrow keys</span><button type="button" data-next aria-label="Next enlarged photo">Next →</button></div>';
    document.body.appendChild(dialog);
    var enlarged = dialog.querySelector('img'), savedOverflow;
    main.tabIndex = 0;
    main.setAttribute('role', 'button');
    main.setAttribute('aria-haspopup', 'dialog');
    main.setAttribute('aria-label', 'Enlarge photo');
    srcs.forEach(function (src, index) {
      var thumb = new Image();
      thumb.src = src; thumb.alt = alt + ' — photo ' + (index + 1);
      thumb.loading = 'lazy'; thumb.tabIndex = 0;
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', 'View photo ' + (index + 1) + ' of ' + srcs.length);
      thumb.addEventListener('click', function () { i = index; show(); });
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); i = index; show(); }
      });
      strip.appendChild(thumb);
    });
    var thumbs = strip.querySelectorAll('img');
    function show() {
      main.src = srcs[i];
      main.alt = alt + ' — photo ' + (i + 1) + ' of ' + srcs.length;
      count.textContent = (i + 1) + ' / ' + srcs.length;
      thumbs.forEach(function (thumb, index) {
        thumb.classList.toggle('on', index === i);
        thumb.setAttribute('aria-pressed', String(index === i));
      });
      var tr = thumbs[i].getBoundingClientRect(), sr = strip.getBoundingClientRect();
      if (tr.left < sr.left || tr.right > sr.right) strip.scrollLeft += tr.left - sr.left - (strip.clientWidth - thumbs[i].clientWidth) / 2;
      if (dialog.open) {
        enlarged.src = srcs[i]; enlarged.alt = main.alt;
        dialog.querySelector('.photo-viewer__count').textContent = 'Photo ' + (i + 1) + ' of ' + srcs.length;
      }
    }
    function move(delta) { i = (i + delta + srcs.length) % srcs.length; show(); }
    function open() {
      savedOverflow = document.body.style.overflow;
      dialog.showModal(); document.body.style.overflow = 'hidden'; show();
    }
    main.addEventListener('click', open);
    main.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    g.querySelector('.jgal__ar--p').addEventListener('click', function () { move(-1); });
    g.querySelector('.jgal__ar--n').addEventListener('click', function () { move(1); });
    dialog.querySelector('[data-prev]').addEventListener('click', function () { move(-1); });
    dialog.querySelector('[data-next]').addEventListener('click', function () { move(1); });
    dialog.querySelector('.photo-viewer__close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', function () {
      document.body.style.overflow = savedOverflow;
      main.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    function arrows(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1);
      }
    }
    g.addEventListener('keydown', arrows);
    dialog.addEventListener('keydown', arrows);
    var start;
    enlarged.addEventListener('touchstart', function (e) {
      start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, { passive: true });
    enlarged.addEventListener('touchend', function (e) {
      if (!start || e.touches.length) { start = null; return; }
      var dx = e.changedTouches[0].clientX - start.x, dy = e.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
      start = null;
    }, { passive: true });
    enlarged.addEventListener('touchcancel', function () { start = null; });
    show();
  });
})();
