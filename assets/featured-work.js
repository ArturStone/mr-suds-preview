(function () {
  'use strict';
  var root = document.querySelector('[data-featured-work]');
  if (!root) return;
  var previous = root.querySelector('[data-previous]'), next = root.querySelector('[data-next]');
  previous.disabled = next.disabled = true;
  fetch(new URL('featured-work.json', document.currentScript.src)).then(function (r) {
    if (!r.ok) throw new Error('Unable to load featured work');
    return r.json();
  }).then(function (pairs) {
    var slides = [];
    pairs.forEach(function (pair) {
      [pair.before, pair.after].forEach(function (src) {
        slides.push({src:src, vehicle:pair.vehicle, detail:pair.detail, href:pair.href});
      });
    });
    var photoCount = slides.length;
    slides.push({cta:true});
    var i = 0;
    function show() {
      var slide = slides[i], photo = root.querySelector('[data-photo]');
      var cta = root.querySelector('[data-featured-cta]');
      var project = root.querySelector('[data-project]');
      if (slide.cta) {
        photo.hidden = true;
        cta.hidden = false;
        project.hidden = true;
        root.querySelector('[data-count]').textContent = '';
      } else {
        photo.hidden = false;
        cta.hidden = true;
        project.hidden = false;
        photo.src = slide.src;
        photo.alt = slide.vehicle + ' — ' + slide.detail;
        project.href = slide.href; project.textContent = slide.vehicle;
        root.querySelector('[data-count]').textContent = (i + 1) + ' / ' + photoCount;
      }
    }
    function move(delta) { i = (i + delta + slides.length) % slides.length; show(); }
    previous.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    previous.disabled = next.disabled = false;
  }).catch(function () {
    // Keep the first photograph visible when the optional gallery data cannot load.
    root.querySelector('[data-count]').textContent = '';
  });
})();
