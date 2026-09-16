(function () {
  'use strict';
  var root = document.querySelector('[data-polish-gallery]');
  if (!root) return;
  var previous = root.querySelector('[data-gallery-prev]'), next = root.querySelector('[data-gallery-next]');
  previous.disabled = next.disabled = true;
  fetch(new URL('polishing-gallery.json', document.currentScript.src)).then(function (r) {
    if (!r.ok) throw new Error('Gallery unavailable');
    return r.json();
  }).then(function (photos) {
    if (!photos.length) return;
    var index = 0;
    function show() {
      var photo = photos[index], image = root.querySelector('[data-gallery-photo]');
      var placeholder = root.querySelector('[data-placeholder]');
      image.hidden = !photo.src; placeholder.hidden = !!photo.src;
      if (photo.src) { image.src = photo.src; image.alt = photo.alt; }
      placeholder.querySelector('span').textContent = photo.caption;
      root.querySelector('[data-gallery-count]').textContent = (index + 1) + ' / ' + photos.length;
      root.querySelector('.polish-gallery__heading > span').textContent = photos.some(function (p) { return p.src; }) ? '' : 'Coming soon';
    }
    function move(delta) { index = (index + delta + photos.length) % photos.length; show(); }
    previous.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    previous.disabled = next.disabled = photos.length < 2;
    show();
  }).catch(function () { root.querySelector('[data-gallery-count]').textContent = ''; });
})();
