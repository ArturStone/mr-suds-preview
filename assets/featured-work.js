(function () {
  'use strict';
  var root = document.querySelector('[data-featured-work]');
  if (!root) return;
  var previous = root.querySelector('[data-previous]'), next = root.querySelector('[data-next]');
  previous.disabled = next.disabled = true;
  fetch(new URL('featured-work.json', document.currentScript.src)).then(function (r) {
    if (!r.ok) throw new Error('Unable to load featured work');
    return r.json();
  }).then(function (slides) {
    var i = 0;
    function show() {
      var slide = slides[i], before = root.querySelector('[data-before]'), after = root.querySelector('[data-after]');
      before.src = slide.before; after.src = slide.after;
      before.alt = slide.vehicle + ' — ' + slide.detail + ' before cleaning';
      after.alt = slide.vehicle + ' — ' + slide.detail + ' after cleaning';
      var project = root.querySelector('[data-project]');
      project.href = slide.href; project.textContent = slide.vehicle + ' · ' + slide.detail;
      root.querySelector('[data-location]').textContent = slide.place;
      root.querySelector('[data-count]').textContent = (i + 1) + ' / ' + slides.length;
    }
    function move(delta) { i = (i + delta + slides.length) % slides.length; show(); }
    previous.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    previous.disabled = next.disabled = false;
  }).catch(function () {
    // Keep the first real pair visible when the optional gallery data cannot load.
    root.querySelector('[data-count]').textContent = '';
  });
})();
